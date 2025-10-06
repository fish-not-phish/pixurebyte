#!/usr/bin/env bash
set -euo pipefail

if ! command -v terraform >/dev/null 2>&1; then
  echo "Terraform is required. Please install Terraform >= 1.6.0"
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI is required. Please install it and configure credentials."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Please install Docker and ensure it’s running."
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "OpenSSL is required to generate Django SECRET_KEY. Please install it."
  exit 1
fi

echo "Please enter your custom domain (example: pixurebyte.com)"
read -rp "Custom domain: " CUSTOM_DOMAIN

CUSTOM_DOMAIN=$(echo "$CUSTOM_DOMAIN" | sed 's~^https://~~' | sed 's~/$~~')

CUSTOM_DOMAIN_FULL="https://${CUSTOM_DOMAIN}"
CUSTOM_API_URL="${CUSTOM_DOMAIN_FULL}/api"

echo "✅ Using domain: ${CUSTOM_DOMAIN_FULL}"
echo "✅ API endpoint will be: ${CUSTOM_API_URL}"
echo

echo "Please enter your preferred AWS region [us-east-2]:"
read -rp "AWS region: " AWS_DEFAULT_REGION
AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-2}

# Update terraform.tfvars automatically with chosen region
if [[ -f terraform.tfvars ]]; then
  echo "Updating terraform.tfvars with region: ${AWS_DEFAULT_REGION}"
  sed -i.bak "s/^aws_region *= *.*/aws_region        = \"${AWS_DEFAULT_REGION}\"/" terraform.tfvars
else
  echo "Creating terraform.tfvars with region ${AWS_DEFAULT_REGION}"
  cat > terraform.tfvars <<EOF
aws_region        = "${AWS_DEFAULT_REGION}"
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
EOF
fi

read -rp "Database name [pixurebytedb]: " DB_NAME
DB_NAME=${DB_NAME:-pixurebytedb}

read -rp "Database user [pixurebyte]: " DB_USER
DB_USER=${DB_USER:-pixurebyte}

read -rp "Database password [pixurebyte_pass]: " DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-pixurebyte_pass}

read -rp "Database host [db]: " DB_HOST
DB_HOST=${DB_HOST:-db}

read -rp "Database port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -rp "Redis URL [redis://redis:6379/0]: " REDIS_URL
REDIS_URL=${REDIS_URL:-redis://redis:6379/0}

echo
echo "✅ Database config:"
echo "  DB_NAME=${DB_NAME}"
echo "  DB_USER=${DB_USER}"
echo "  DB_HOST=${DB_HOST}"
echo "  DB_PORT=${DB_PORT}"
echo "✅ Redis config:"
echo "  REDIS_URL=${REDIS_URL}"
echo

# Initialize and apply Terraform
terraform init
terraform apply -auto-approve

# Retrieve outputs for Django environment
echo "Collecting Terraform outputs..."

AWS_DEFAULT_REGION=$(terraform output -raw aws_region)
AWS_ACCESS_KEY_ID=$(terraform output -raw django_access_key_id)
AWS_SECRET_ACCESS_KEY=$(terraform output -raw django_secret_access_key)
PUBLIC_SUBNET_ID=$(terraform output -raw public_subnet_id)
SECURITY_GROUP_ID=$(terraform output -raw ecs_tasks_security_group_id)
S3_BUCKET_NAME=$(terraform output -raw s3_bucket_name)
CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain_name)
ECR_REPO_URL=$(terraform output -raw ecr_repository_url)
ECS_CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
TASK_DEFINITION_ARN=$(terraform output -raw task_definition_arn)

echo "Generating Django SECRET_KEY..."
DJANGO_SECRET_KEY=$(openssl rand -base64 48 | tr -d '\n')

ALLOWED_HOSTS="${CUSTOM_DOMAIN},.${CUSTOM_DOMAIN}"
echo "✅ ALLOWED_HOSTS: ${ALLOWED_HOSTS}"

# Generate .env.django file
echo "Writing Django AWS environment to .env.django ..."
cat > .env.django <<EOF
SECRET_KEY=${DJANGO_SECRET_KEY}
ALLOWED_HOSTS=${ALLOWED_HOSTS}
AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
S3_BUCKET_NAME=${S3_BUCKET_NAME}
CLOUDFRONT_DOMAIN=${CLOUDFRONT_DOMAIN}
ECR_REPO_URL=${ECR_REPO_URL}
ECS_CLUSTER_NAME=${ECS_CLUSTER_NAME}
TASK_DEFINITION_ARN=${TASK_DEFINITION_ARN}
PUBLIC_SUBNET_ID=${PUBLIC_SUBNET_ID}
SECURITY_GROUP_ID=${SECURITY_GROUP_ID}
CUSTOM_DOMAIN=${CUSTOM_DOMAIN}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
EOF

echo "✅ .env.django file created successfully!"
echo
echo "Contents preview (AWS_SECRET_ACCESS_KEY masked):"
grep -v "AWS_SECRET_ACCESS_KEY" .env.django
echo
echo "✅ .env.django file created successfully!"

# --- PREVIEW SAFE CONTENT ---
echo
echo "Contents preview (AWS_SECRET_ACCESS_KEY masked):"
grep -v "AWS_SECRET_ACCESS_KEY" .env.django
echo

BACKEND_ENV="../backend/.env"
echo "Copying .env.django to ${BACKEND_ENV}..."
mkdir -p ../backend
cp .env.django "${BACKEND_ENV}"
echo "✅ Copied environment file to backend successfully."
echo

# --- CREATE FRONTEND .env FILE ---
FRONTEND_ENV="../frontend/.env"
echo "Creating frontend .env at ${FRONTEND_ENV} ..."
mkdir -p ../frontend
cat > "${FRONTEND_ENV}" <<EOF
NEXT_PUBLIC_API_URL=${CUSTOM_API_URL}
EOF
echo "✅ Created frontend .env file successfully."
echo

# --- BUILD AND PUSH DOCKER IMAGE TO ECR ---
echo "🚀 Building and pushing Docker image to ECR..."

# Ensure region and repo info exist
if [[ -z "${ECR_REPO_URL}" || -z "${AWS_DEFAULT_REGION}" ]]; then
  echo "❌ Missing ECR repository info or AWS region. Check Terraform outputs."
  exit 1
fi

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region "${AWS_DEFAULT_REGION}" | docker login --username AWS --password-stdin "${ECR_REPO_URL}"

# Define image tag (same as ECS task definition)
IMAGE_TAG="latest"
IMAGE_NAME="${ECR_REPO_URL}:${IMAGE_TAG}"

# Build image (assumes Dockerfile is one directory up, inside ./docker/)
DOCKER_CONTEXT="../docker"

if [ ! -d "${DOCKER_CONTEXT}" ]; then
  echo "❌ Expected Docker context directory '${DOCKER_CONTEXT}' not found."
  exit 1
fi

echo "Building image from ${DOCKER_CONTEXT}..."
docker build -t pixurebyte:latest "${DOCKER_CONTEXT}"

echo "Tagging image as ${IMAGE_NAME}..."
docker tag pixurebyte:latest "${IMAGE_NAME}"

echo "Pushing image to ${ECR_REPO_URL}..."
docker push "${IMAGE_NAME}"

echo "Building backend and frontend docker images..."
docker build -t pixurebyte-backend -f ../Dockerfile.backend ..
docker build -t pixurebyte-frontend -f ../Dockerfile.frontend ..

echo "🎉 Setup complete!"
echo "Django backend and Next.js frontend are now configured with environment files."