data "aws_caller_identity" "acct" {}
data "aws_partition" "current" {}

################
# ECR          #
################
resource "aws_ecr_repository" "repo" {
  name          = var.ecr_repo_name
  force_delete  = true

  # Supported across all recent Terraform AWS provider versions
  image_scanning_configuration {
    scan_on_push = true
  }

  # Older providers use "image_tag_mutability" instead of "image_mutability"
  image_tag_mutability = "MUTABLE"

  tags = merge(var.tags, { Name = var.ecr_repo_name })
}

################
# ECS Cluster  #
################
resource "aws_ecs_cluster" "this" {
  name = var.ecs_cluster_name

  setting {
    name  = "containerInsights"
    value = "disabled"
  }

  tags = merge(var.tags, { Name = var.ecs_cluster_name })
}

resource "aws_ecs_cluster_capacity_providers" "this" {
  cluster_name = aws_ecs_cluster.this.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

################
# Task Def     #
################
locals {
  ecr_repo_url    = "${data.aws_caller_identity.acct.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${aws_ecr_repository.repo.name}"
  scanner_image   = "${local.ecr_repo_url}:${var.container_image_tag}"
}

resource "aws_ecs_task_definition" "scanner" {
  family                   = "scanner"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "2048"

  execution_role_arn = aws_iam_role.ecs_task_execution.arn
  task_role_arn      = aws_iam_role.ecs_task_role.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name        = "scan",
      image       = local.scanner_image,
      essential   = true,
      cpu         = 0,
      entryPoint  = ["python", "app.py"],
      environment = [],
      portMappings = [],
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs.name,
          awslogs-create-group  = "true",
          awslogs-region        = var.aws_region,
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  tags = merge(var.tags, { Name = "scanner-taskdef" })
}
