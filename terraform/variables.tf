variable "project_name" {
  description = "Project name prefix for resources."
  type        = string
  default     = "pixurebyte"
}

variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
}

variable "az_suffix" {
  description = "Single-AZ suffix for subnets (e.g., 'a')."
  type        = string
  default     = "a"
}

variable "vpc_cidr" {
  description = "VPC CIDR block."
  type        = string
  default     = "10.0.0.0/21" # Using .0 (valid network base)
}

variable "bucket_name" {
  description = "Exact S3 bucket name (must be globally unique)."
  type        = string
  default     = "pixurebyte-randomNumbers"
}

variable "ecr_repo_name" {
  description = "ECR repository name."
  type        = string
  default     = "pixurebyte"
}

variable "ecs_cluster_name" {
  description = "ECS cluster name."
  type        = string
  default     = "pixurebyte"
}

variable "container_image_tag" {
  description = "Tag for the scanner image."
  type        = string
  default     = "latest"
}

variable "tags" {
  description = "Common resource tags."
  type        = map(string)
  default     = {
    Project = "pixurebyte"
    Managed = "terraform"
  }
}
