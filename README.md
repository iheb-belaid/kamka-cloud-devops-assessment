# Kamka Cloud & DevOps Assessment

This repository contains a minimal three-tier Todo application built for the KAMKA IT Cloud & DevOps internship technical assessment.

## Architecture

- `frontend`: static HTML/CSS/JavaScript served by Nginx
- `api`: Spring Boot REST API
- `db`: PostgreSQL
- `monitoring`: Uptime Kuma
- `ci/cd`: GitHub Actions building and publishing Docker images to GHCR

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
- A GitHub account if you want to push images to GHCR

## Environment variables

1. Copy `.env.example` to `.env`.
2. Replace the placeholder values, especially:
   - `POSTGRES_PASSWORD`
   - `IMAGE_REGISTRY`
   - `GHCR_USERNAME`
   - `GHCR_TOKEN`

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

Uptime Kuma starts empty on first launch. Create the admin account, then add these HTTP monitors:

- `Frontend health` -> `http://frontend/health`
- `API health` -> `http://api:8080/actuator/health`

Those URLs work from inside the Docker network, so Kuma can monitor the stack directly.

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
- `docker-compose.prod.yml` switches the API and frontend to prebuilt images from a registry

This keeps the runtime shape almost identical while still supporting CI/CD and remote deployment.

## CI/CD pipeline

The GitHub Actions workflow does four things:

1. Runs Spring Boot tests.
2. Builds the API and frontend Docker images.
3. Pushes the images to GHCR on non-PR events.
4. Triggers a deployment job on pushes to `main`.

If no remote deployment secrets are configured, the deployment job exits with a clear explanation and the repository remains deployable through `scripts/deploy.sh`.

### Optional live deployment secrets

To enable SSH deployment from GitHub Actions, configure:

- `DEPLOY_HOST`
- `DEPLOY_USERNAME`
- `DEPLOY_SSH_KEY`

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
- logs into GHCR when credentials are provided
- pulls the production images
- starts the stack
- checks that core services become healthy

## API contract

- `GET /api/todos` -> list all todos
- `POST /api/todos` -> create a todo with JSON body `{ "title": "..." }`
- `PATCH /api/todos/{id}/complete` -> toggle completion state
- `DELETE /api/todos/{id}` -> delete a todo

## What is still manual

- Docker-based runtime validation on this workstation, because Docker was not installed yet
- First-time monitor creation inside Uptime Kuma
- Optional live deployment host provisioning

## Suggested next steps before submission

1. Install Docker Desktop.
2. Run `docker compose up --build`.
3. Create the two Kuma monitors and capture screenshots.
4. Push the repo to GitHub and verify the workflow.
5. Export the notes in `docs/assessment-notes.md` as PDF.
