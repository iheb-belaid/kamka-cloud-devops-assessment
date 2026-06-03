#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${1:-${PROJECT_ROOT}/.env}"
REQUIRED_VARS=(
  POSTGRES_DB
  POSTGRES_USER
  POSTGRES_PASSWORD
  IMAGE_REGISTRY
  IMAGE_TAG
)

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed or not available in PATH." >&2
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  echo "Error: environment file not found at ${ENV_FILE}." >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

for var_name in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var_name:-}" ]; then
    echo "Error: ${var_name} must be set in ${ENV_FILE}." >&2
    exit 1
  fi
done

if [ -n "${GHCR_USERNAME:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin
fi

echo "Pulling production images..."
docker compose --env-file "${ENV_FILE}" -f "${PROJECT_ROOT}/docker-compose.prod.yml" pull

echo "Starting production stack..."
docker compose --env-file "${ENV_FILE}" -f "${PROJECT_ROOT}/docker-compose.prod.yml" up -d

echo "Waiting for services to become healthy..."
for service in api frontend db; do
  container_id="$(docker compose --env-file "${ENV_FILE}" -f "${PROJECT_ROOT}/docker-compose.prod.yml" ps -q "${service}")"

  if [ -z "${container_id}" ]; then
    echo "Error: could not find running container for service '${service}'." >&2
    exit 1
  fi

  for _ in $(seq 1 24); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}")"
    if [ "${status}" = "healthy" ] || [ "${status}" = "running" ]; then
      break
    fi
    sleep 5
  done

  final_status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}")"
  if [ "${final_status}" != "healthy" ] && [ "${final_status}" != "running" ]; then
    echo "Error: service '${service}' failed to become healthy. Current status: ${final_status}" >&2
    docker compose --env-file "${ENV_FILE}" -f "${PROJECT_ROOT}/docker-compose.prod.yml" logs "${service}" >&2
    exit 1
  fi
done

echo "Deployment completed successfully."
