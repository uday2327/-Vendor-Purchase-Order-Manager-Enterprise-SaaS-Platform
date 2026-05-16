# Jenkins Setup

This project includes a root `Jenkinsfile` for running CI/CD through Jenkins.

## Agent Requirements

Install these tools on the Jenkins agent:

- Git
- Node.js 20.19 or newer
- npm
- Docker and Docker Compose, unless the job sets `SKIP_DOCKER=true`

Node 20.19+ is required because the Vite client declares that minimum version.

## Jenkins Job

1. Create a Jenkins Pipeline or Multibranch Pipeline job.
2. Connect the job to this Git repository.
3. Set the pipeline script path to `Jenkinsfile`.
4. Run the job manually once to confirm the agent tools are available.
5. Add a GitHub webhook if you want builds to run automatically on push.

## Credentials

For deployment from Jenkins, create these Jenkins credentials as **Secret text**:

```text
render-deploy-hook-url
vercel-deploy-hook-url
```

The deploy stage runs only for the `main` branch. If either credential is missing, Jenkins will fail when it reaches the deploy stage, so add the credentials before using Jenkins for production deployment.

## Pipeline Stages

The Jenkins pipeline runs:

1. Verify Node, npm, and Git on the Jenkins agent.
2. Install server and client dependencies in parallel.
3. Check backend syntax and build the frontend in parallel.
4. Start the backend with `SKIP_DB=true` and test `/api/health`.
5. Validate `docker-compose.yml` and build server/client Docker images.
6. Trigger Render and Vercel deploy hooks on `main`.
7. Archive the frontend build output and backend smoke-test log.

## Optional Docker Skip

If a Jenkins agent does not have Docker, set this build environment variable:

```text
SKIP_DOCKER=true
```

That skips the Docker validation stage while keeping the Node.js CI checks active.

## Deployment Note

Use one deployment controller at a time. If Jenkins is the main CD system, disable GitHub Actions deployment or Render/Vercel auto-deploys to avoid duplicate production deployments.
