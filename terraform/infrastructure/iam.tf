data "aws_caller_identity" "this" {}

########################
# ECS Roles + Policies #
########################

# Execution role: pulls from ECR, writes logs
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-task-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "ecs-tasks.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ecs_exec_managed" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Extra: allow creating log groups (per your snippet)
resource "aws_iam_policy" "logs_create_group" {
  name        = "${var.project_name}-logs-create-group"
  description = "Allow creating CloudWatch log groups"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "VisualEditor0",
        Effect   = "Allow",
        Action   = ["logs:CreateLogGroup"],
        Resource = "arn:aws:logs:*:${data.aws_caller_identity.this.account_id}:log-group:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_exec_logs_create" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = aws_iam_policy.logs_create_group.arn
}

# Task role: app-level permissions (S3 full on your bucket)
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "ecs-tasks.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
  tags = var.tags
}

resource "aws_iam_policy" "task_s3_full_bucket" {
  name        = "${var.project_name}-task-s3-full"
  description = "S3 full access to the media bucket"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["s3:*"],
        Resource = [
          aws_s3_bucket.media.arn,
          "${aws_s3_bucket.media.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "task_s3_attach" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.task_s3_full_bucket.arn
}

#########################
# Django IAM (user)     #
#########################
# You asked for creds suitable for Django to manage S3 and CloudFront.
# Many CloudFront actions require '*' resource. We grant cloudfront:* on *
# and s3:* on the bucket only. Scope carefully in production.

resource "aws_iam_user" "django" {
  name = "${var.project_name}-django"
  tags = var.tags
}

resource "aws_iam_user_policy" "django_policy" {
  name = "${var.project_name}-django-cloudfront-s3-ecr-ecs-ec2"
  user = aws_iam_user.django.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      # --- CloudFront permissions ---
      {
        Sid      = "CloudFrontAll",
        Effect   = "Allow",
        Action   = ["cloudfront:*"],
        Resource = "*"
      },

      # --- S3 bucket permissions ---
      {
        Sid      = "S3BucketFull",
        Effect   = "Allow",
        Action   = ["s3:*"],
        Resource = [
          aws_s3_bucket.media.arn,
          "${aws_s3_bucket.media.arn}/*"
        ]
      },

      # --- ECR push/pull permissions ---
      {
        Sid      = "ECRPushPull",
        Effect   = "Allow",
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:GetDownloadUrlForLayer",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart",
          "ecr:BatchGetImage",
          "ecr:DescribeRepositories",
          "ecr:ListImages"
        ],
        Resource = [
          aws_ecr_repository.repo.arn
        ]
      },

      # --- ECR login token (global) ---
      {
        Sid      = "ECRLoginTokenGlobal",
        Effect   = "Allow",
        Action   = ["ecr:GetAuthorizationToken"],
        Resource = "*"
      },

      # --- ECS permissions for running scans ---
      {
        Sid      = "ECSRunTasks",
        Effect   = "Allow",
        Action = [
          "ecs:RunTask",
          "ecs:StopTask",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:DescribeTaskDefinition",
          "ecs:ListClusters",
          "ecs:DescribeClusters"
        ],
        Resource = "*"
      },

      # --- IAM PassRole permission ---
      {
        Sid      = "PassEcsRoles",
        Effect   = "Allow",
        Action   = "iam:PassRole",
        Resource = [
          aws_iam_role.ecs_task_execution.arn,
          aws_iam_role.ecs_task_role.arn
        ]
      },

      # --- EC2 describe-only permissions (for inspecting Fargate ENIs, subnets, SGs) ---
      {
        Sid      = "EC2DescribePermissions",
        Effect   = "Allow",
        Action = [
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs",
          "ec2:DescribeSecurityGroups"
        ],
        Resource = "*"
      }
    ]
  })
}

# Access keys (output is sensitive)
resource "aws_iam_access_key" "django" {
  user = aws_iam_user.django.name
}
