output "django_access_key_id" {
  description = "Access key ID for the Django IAM user (use with care)."
  value       = module.infra.django_access_key_id
}

output "django_secret_access_key" {
  description = "Secret access key for the Django IAM user (sensitive)."
  value       = module.infra.django_secret_access_key
  sensitive   = true
}

output "public_subnet_id" {
  description = "Public subnet ID."
  value       = module.infra.public_subnet_id
}

output "ecs_tasks_security_group_id" {
  description = "Security group ID for ECS tasks."
  value       = module.infra.ecs_tasks_security_group_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain."
  value       = module.infra.cloudfront_domain_name
}

output "s3_bucket_name" {
  description = "S3 bucket name."
  value       = module.infra.s3_bucket_name
}

output "aws_region" {
  description = "Region for Django env."
  value       = var.aws_region
}

output "ecr_repository_url" {
  description = "ECR repo URL to push the scanner image."
  value       = module.infra.ecr_repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = module.infra.ecs_cluster_name
}

output "task_definition_arn" {
  description = "ECS task definition ARN."
  value       = module.infra.task_definition_arn
}
