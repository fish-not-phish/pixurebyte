terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.56"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "infra" {
  source = "./infrastructure"

  project_name       = var.project_name
  aws_region         = var.aws_region
  az_suffix          = var.az_suffix
  vpc_cidr           = var.vpc_cidr
  bucket_name        = var.bucket_name
  ecr_repo_name      = var.ecr_repo_name
  ecs_cluster_name   = var.ecs_cluster_name
  container_image_tag= var.container_image_tag
  tags               = var.tags
}
