resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/"
  retention_in_days = 30
  tags              = merge(var.tags, { Name = "${var.project_name}-ecs-logs" })
}
