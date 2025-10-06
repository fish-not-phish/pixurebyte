#!/usr/bin/env bash
set -euo pipefail

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

echo "✅ Docker image successfully pushed to ECR!"
echo
echo "ECR URL: ${ECR_REPO_URL}"
echo "Task Definition: ${TASK_DEFINITION_ARN}"
echo "ECS Cluster: ${ECS_CLUSTER_NAME}"

echo
echo "🎉 Setup complete!"
echo "You can now launch ECS tasks referencing this image and task definition."