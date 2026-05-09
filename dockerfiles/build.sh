#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-sf-orgdevmode-builds}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DOCKERFILE="$(dirname "$0")/Dockerfile"
CONTEXT="$(dirname "$0")/.."

if [[ -z "${VLOCITY_AUTH_KEY:-}" ]]; then
  echo "Error: VLOCITY_AUTH_KEY environment variable is not set." >&2
  echo "Export it before running this script:" >&2
  echo "  export VLOCITY_AUTH_KEY=<your_auth_key>" >&2
  exit 1
fi

echo "Building image ${IMAGE_NAME}:${IMAGE_TAG} ..."

DOCKER_BUILDKIT=1 docker build \
  --platform linux/amd64 \
  --secret id=vlocity_auth_key,env=VLOCITY_AUTH_KEY \
  -f "${DOCKERFILE}" \
  -t "${IMAGE_NAME}:${IMAGE_TAG}" \
  "${CONTEXT}"

echo "Done. Image tagged as ${IMAGE_NAME}:${IMAGE_TAG}"
