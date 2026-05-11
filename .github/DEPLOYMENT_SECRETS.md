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
