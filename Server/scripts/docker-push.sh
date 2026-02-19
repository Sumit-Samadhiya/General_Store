#!/bin/bash

# ============================================================================
# Docker Build and Push Script
# Builds Docker image and pushes to registry
# ============================================================================
# Usage: ./scripts/docker-push.sh <version> <registry>
# Example: ./scripts/docker-push.sh 1.0.0 docker.io/myusername

set -e

VERSION=${1:-latest}
REGISTRY=${2:-docker.io/myusername}
IMAGE_NAME="general-store-api"
FULL_IMAGE="$REGISTRY/$IMAGE_NAME:$VERSION"

echo "Building Docker image: $FULL_IMAGE"
docker build -t "$FULL_IMAGE" -t "$REGISTRY/$IMAGE_NAME:latest" .

if [[ $? -ne 0 ]]; then
    echo "Build failed"
    exit 1
fi

echo "Tagging image..."
docker tag "$FULL_IMAGE" "$REGISTRY/$IMAGE_NAME:latest"

echo "Pushing image to registry..."
docker push "$FULL_IMAGE"
docker push "$REGISTRY/$IMAGE_NAME:latest"

echo "Successfully pushed $FULL_IMAGE"
