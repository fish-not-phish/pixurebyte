# SG for ECS tasks: no inbound, all outbound
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-ecs-tasks-sg"
  description = "ECS tasks security group (deny all inbound, allow all outbound)"
  vpc_id      = aws_vpc.this.id

  egress {
    description      = "All outbound"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = merge(var.tags, { Name = "${var.project_name}-ecs-tasks-sg" })
}
