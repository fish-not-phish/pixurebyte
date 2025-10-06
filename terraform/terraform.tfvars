aws_region        = "us-east-2"
az_suffix         = "a"
bucket_name       = "pixurebyte-"
project_name      = "pixurebyte"
ecr_repo_name     = "pixurebyte"
ecs_cluster_name  = "pixurebyte"
container_image_tag = "latest"

tags = {
  Project = "pixurebyte"
  Env     = "dev"
  Owner   = "platform"
}
