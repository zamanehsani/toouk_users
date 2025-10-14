#!/bin/bash

# Build and Push Script for Toouk Users Service
# Usage: ./build-and-push.sh [tag]

set -e

# Configuration
DOCKER_HUB_USERNAME="zamanehsani"
IMAGE_NAME="toouk-users"
TAG=${1:-latest}
FULL_IMAGE_NAME="${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${TAG}"

echo "🏗️  Building Docker image: ${FULL_IMAGE_NAME}"

# Build the image
docker build -t ${FULL_IMAGE_NAME} .

echo "✅ Build completed successfully!"

# Tag with latest if not already latest
if [ "$TAG" != "latest" ]; then
    docker tag ${FULL_IMAGE_NAME} ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:latest
    echo "🏷️  Tagged as latest"
fi

echo "🚀 Pushing to Docker Hub..."

# Push the specific tag
docker push ${FULL_IMAGE_NAME}

# Push latest tag if created
if [ "$TAG" != "latest" ]; then
    docker push ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:latest
fi

echo "✅ Successfully pushed to Docker Hub!"
echo "📦 Image: ${FULL_IMAGE_NAME}"

# Show image info
echo "📊 Image details:"
docker images ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${TAG}

echo ""
echo "🎉 Ready for deployment! Use this image in your production environment:"
echo "   docker pull ${FULL_IMAGE_NAME}"