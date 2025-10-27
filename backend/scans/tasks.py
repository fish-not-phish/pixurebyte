from celery import shared_task
from django.contrib.auth import get_user_model
from scans.models import Scan
import boto3
import time
from django.conf import settings
import re
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

PUBLIC_SUBNET_ID = settings.PUBLIC_SUBNET_ID
CUSTOM_DOMAIN = settings.CUSTOM_DOMAIN
SECURITY_GROUP_ID = settings.SECURITY_GROUP_ID
CLUSTER_NAME = settings.ECS_CLUSTER_NAME
TASK_DEFINITION_ARN = settings.TASK_DEFINITION_ARN
AWS_MEDIA_BUCKET_NAME = settings.AWS_MEDIA_BUCKET_NAME

pattern = r"task-definition/([^:]+):([^:]+)$"
match = re.search(pattern, TASK_DEFINITION_ARN)

if match:
    image_name = match.group(1)
    tag = match.group(2)
    TASK_DEFINITION = f'{image_name}:{tag}'
else:
    TASK_DEFINITION = None

ecs_client = boto3.client("ecs")
ec2_client = boto3.client("ec2")


@shared_task
def initiate_scan(scan_id: str):
    scan = Scan.objects.get(id=scan_id)

    network_configuration = {
        "awsvpcConfiguration": {
            "subnets": [PUBLIC_SUBNET_ID],
            "securityGroups": [SECURITY_GROUP_ID],
            "assignPublicIp": "ENABLED",
        }
    }

    overrides = {
        "containerOverrides": [
            {
                "name": "scan",
                "environment": [
                    {"name": "scan_id", "value": str(scan.id)},
                    {"name": "team_id", "value": str(scan.team.id)},
                    {"name": "url", "value": scan.url},
                    {"name": "DJANGO_BACKEND", "value": CUSTOM_DOMAIN},
                    {"name": "SCAN_BUCKET", "value": AWS_MEDIA_BUCKET_NAME},
                ],
            }
        ]
    }

    def try_run(cp):
        return ecs_client.run_task(
            cluster=CLUSTER_NAME,
            capacityProviderStrategy=[{"capacityProvider": cp, "weight": 1}],
            taskDefinition=TASK_DEFINITION,
            networkConfiguration=network_configuration,
            overrides=overrides,
        )

    try:
        response = try_run("FARGATE_SPOT")
        cp_used = "FARGATE_SPOT"
    except ecs_client.exceptions.ClientError as e:
        if "insufficient capacity" in str(e).lower():
            response = try_run("FARGATE")
            cp_used = "FARGATE"
        else:
            raise

    task_arn = response["tasks"][0]["taskArn"]

    while True:
        desc = ecs_client.describe_tasks(cluster=CLUSTER_NAME, tasks=[task_arn])
        status = desc["tasks"][0]["lastStatus"]
        if status == "RUNNING":
            break
        time.sleep(3)

    attachments = desc["tasks"][0]["attachments"]
    eni_id = next(
        detail["value"]
        for att in attachments if att["type"] == "ElasticNetworkInterface"
        for detail in att["details"]
        if detail["name"] == "networkInterfaceId"
    )
    eni = ec2_client.describe_network_interfaces(NetworkInterfaceIds=[eni_id])
    public_ip = eni["NetworkInterfaces"][0]["Association"]["PublicIp"]
    private_ip = eni["NetworkInterfaces"][0]["PrivateIpAddress"]

    scan.task_arn = task_arn
    scan.capacity_provider = cp_used
    scan.public_ip = public_ip
    scan.private_ip = private_ip
    scan.save(update_fields=["task_arn", "capacity_provider", "public_ip", "private_ip"])

    return {
        "status": "processing",
        "scan_id": str(scan.id),
        "team_id": str(scan.team.id),
        "task_arn": task_arn,
        "capacity_provider": cp_used,
        "public_ip": public_ip,
        "private_ip": private_ip,
    }

@shared_task
def mark_stale_scans():
    threshold = timezone.now() - timedelta(minutes=2)
    stale_scans = Scan.objects.filter(status="processing", created_at__lt=threshold)
    count = stale_scans.update(status="failed")
    return f"{count} stale scan(s) marked as failed."