# Kamka Cloud & DevOps Assessment

This repository contains a minimal three-tier Todo application built for the KAMKA IT Cloud & DevOps internship technical assessment.

## Architecture

- `frontend`: static HTML/CSS/JavaScript served by Nginx
- `api`: Spring Boot REST API
- `db`: PostgreSQL
- `monitoring`: Uptime Kuma
- `ci/cd`: GitHub Actions building and publishing Docker images to Docker Hub

The frontend talks to the API through Nginx, and the API talks to PostgreSQL.

## Repository structure

```text
.
├── api/
├── frontend/
├── scripts/
├── docs/
├── .github/workflows/ci-cd.yml
├── .env.example
├── docker-compose.yml
└── docker-compose.prod.yml
```

## Prerequisites

- Docker Desktop or Docker Engine with Compose v2
- Java 17 and Maven only if you want to run the API outside Docker
- A Docker Hub account if you want the workflow to publish images

## Environment variables

1. Copy `.env.example` to `.env`.
2. Replace the placeholder values, especially:
   - `POSTGRES_PASSWORD`
   - `IMAGE_REGISTRY`
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`

Secrets are never committed. The real `.env` file is ignored by Git.

## Run locally

```bash
cp .env.example .env
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8081/api/todos`
- API health: `http://localhost:8081/actuator/health`
- Uptime Kuma: `http://localhost:3001`

## First Uptime Kuma setup

Uptime Kuma starts empty on first launch. Create the admin account, then add these monitors:

- `Frontend health` -> `http://frontend/health`
- `API health` -> `http://api:8080/actuator/health`
- `PostgreSQL` -> TCP host `db`, port `5432`

Those targets work from inside the Docker network, so Kuma can monitor the stack directly.

## Running the API without Docker

From `api/`:

```bash
./mvnw spring-boot:run
```

Override the database settings if you are not using the default local PostgreSQL instance.

## Dev vs prod parity

Both environments use the same services and the same container topology:

- Nginx frontend
- Spring Boot API
- PostgreSQL
- Uptime Kuma

Main difference:

- `docker-compose.yml` builds images locally for development
- `docker-compose.prod.yml` switches the API and frontend to prebuilt images from Docker Hub

This keeps the runtime shape almost identical while still supporting CI/CD and reproducible deployment.

## CI/CD pipeline

The GitHub Actions workflow does four things:

1. Runs Spring Boot tests.
2. Builds the API and frontend Docker images on every push and pull request.
3. Pushes the images to Docker Hub on push events.
4. Triggers a deployment job on pushes to `main`.

On pull requests, the workflow validates tests and image builds, but skips registry pushes and deployment.

Docker Hub is used for the submission because public images are easier for a reviewer to inspect and pull without extra registry access.

### Required pipeline secrets

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

### Optional live deployment secrets

To enable SSH deployment from GitHub Actions, configure:

- `DEPLOY_HOST`
- `DEPLOY_USERNAME`
- `DEPLOY_SSH_KEY`

If no remote deployment secrets are configured, the deployment job exits with a clear explanation and the repository remains deployable through `docker-compose.prod.yml` and `scripts/deploy.sh`.

The target host also needs Docker Compose and a populated `.env` file.

## Production deployment script

The deployment script is `scripts/deploy.sh`.

Example:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh .env
```

The script:

- validates required variables
- optionally logs into Docker Hub when credentials are provided
- pulls the production images
- starts the stack
- checks that core services become healthy

## API contract

- `GET /api/todos` -> list all todos
- `POST /api/todos` -> create a todo with JSON body `{ "title": "..." }`
- `PATCH /api/todos/{id}/complete` -> toggle completion state
- `DELETE /api/todos/{id}` -> delete a todo

## Current validation status

- Local Docker runtime validation is complete on this workstation
- The stack starts successfully with `docker compose up --build -d`
- Uptime Kuma is configured with frontend, API, and PostgreSQL monitors
- Optional live deployment host provisioning is still pending

## Suggested next steps before submission

1. Push the repo to GitHub and verify the Docker Hub workflow.
2. Confirm that both images appear on Docker Hub with SHA and `latest` tags.
3. Capture screenshots of the running stack and the three Kuma monitors.
4. Finalize the deployment notes and environment variable instructions.
5. Export the notes in `docs/assessment-notes.md` as PDF.
