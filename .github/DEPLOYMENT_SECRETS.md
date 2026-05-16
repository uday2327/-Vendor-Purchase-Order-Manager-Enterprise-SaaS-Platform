# Deployment Secrets

This project now includes a GitHub Actions CD workflow in `.github/workflows/cd.yml`.

To use it, add these repository secrets in GitHub:

- `RENDER_DEPLOY_HOOK_URL`
- `VERCEL_DEPLOY_HOOK_URL`

## Where to get them

### Render

1. Open the Render dashboard
2. Open your backend service
3. Find the deploy hook section
4. Copy the deploy hook URL
5. Save it in GitHub as `RENDER_DEPLOY_HOOK_URL`

### Vercel

1. Open the Vercel dashboard
2. Open your frontend project
3. Create a deploy hook
4. Copy the hook URL
5. Save it in GitHub as `VERCEL_DEPLOY_HOOK_URL`

## How the CD workflow behaves

- If the secrets are present, GitHub Actions triggers deployment automatically after CI succeeds on `main`
- If the secrets are missing, the workflow still documents the CD process but deployment hooks are skipped

## Demo deployment checklist

1. Push the project to GitHub.
2. In GitHub, open **Settings > Secrets and variables > Actions**.
3. Add `RENDER_DEPLOY_HOOK_URL` and `VERCEL_DEPLOY_HOOK_URL`.
4. Push to the `main` branch.
5. Open **Actions** and confirm `CI Pipeline` passes.
6. Confirm `CD Pipeline` runs after CI and triggers Render/Vercel.

If Vercel and Render are directly connected to the GitHub repository, they can also auto-deploy on every push to `main`. In that setup, this CD workflow is still useful as an explicit deployment record in GitHub Actions.

## Jenkins option

This repository includes a root `Jenkinsfile` for Jenkins CI/CD.

To use Jenkins:

1. Install Jenkins with Git, Node.js 20.19+, npm, Docker, and Docker Compose available on the Jenkins agent.
2. Create a Jenkins Pipeline job.
3. Point the job to this GitHub repository.
4. Set the pipeline script path to `Jenkinsfile`.
5. Add two Jenkins secret text credentials:
   - ID: `render-deploy-hook-url`
   - ID: `vercel-deploy-hook-url`
6. Run the job manually once.
7. Add a GitHub webhook to Jenkins if you want the job to run automatically on push.

The Jenkins pipeline installs backend/frontend dependencies in parallel, checks server syntax, builds the frontend, smoke-tests `/api/health`, validates Docker Compose, builds Docker images, archives build output, and triggers Render/Vercel deploy hooks when the branch is `main`.

If the Jenkins agent does not have Docker, set `SKIP_DOCKER=true` in the Jenkins build environment. Full setup details are in `JENKINS_SETUP.md`.
