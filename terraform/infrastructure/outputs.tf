output "public_subnet_id" {
  value = aws_subnet.public.id
}

output "ecs_tasks_security_group_id" {
  value = aws_security_group.ecs_tasks.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "s3_bucket_name" {
  value = aws_s3_bucket.media.bucket
}

output "ecr_repository_url" {
  value = aws_ecr_repository.repo.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "task_definition_arn" {
  value = aws_ecs_task_definition.scanner.arn
}

# Django IAM outputs
output "django_access_key_id" {
  value = aws_iam_access_key.django.id
}

output "django_secret_access_key" {
  value     = aws_iam_access_key.django.secret
  sensitive = true
}
