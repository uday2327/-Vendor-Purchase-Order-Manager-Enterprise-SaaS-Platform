# Vendor and Purchase Order Manager

Vendor and Purchase Order Manager is a full-stack MERN application for managing vendors, purchase orders, invoices, payments, contracts, inventory, budgets, audit logs, notifications, and analytics. The project is designed as an enterprise-style procurement system with authentication, role-based access control, live notifications, reporting, and deployment automation.

The application is split into a React frontend, an Express backend, and a MongoDB database. The frontend is deployed on Vercel, the backend is deployed on Render, and MongoDB Atlas can be used as the production database. The repository also contains DevOps configuration for Docker, GitHub Actions, and Jenkins.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Lucide React |
| Backend | Node.js, Express.js, Socket.io, Nodemailer, ExcelJS |
| Database | MongoDB with Mongoose |
| Authentication | JWT, bcrypt, role-based access control, optional TOTP support |
| Documentation | Swagger API documentation |
| DevOps | Docker, Docker Compose, GitHub Actions, Jenkins, Render, Vercel |

## What The Project Does

This project helps an organization manage its vendor and purchasing workflow from one place. Users can maintain vendor records, create and track purchase orders, manage invoices, record payments, view dashboards, monitor budgets, export reports, and track inventory.

The system supports multiple user roles:

- Admin users can manage the full system.
- Manager users can manage operational purchasing workflows.
- Accountant users can work with invoices, payments, budgets, and finance-related data.
- Viewer users can access read-only areas where allowed.

The backend protects sensitive routes using JWT authentication and role-based middleware. The frontend stores the logged-in user's session and sends the token with API requests.

## Project Structure

```text
vendor-system/
  client/
    src/
      components/          Shared UI components
      context/             Auth and theme context
      lib/                 Axios API client
      pages/               Main application pages
      App.jsx              Frontend route definitions
      main.jsx             React entry point
    Dockerfile             Frontend Docker image
    nginx.conf             Nginx config for Docker deployment
    package.json           Frontend dependencies and scripts
    vercel.json            Vercel single-page app configuration

  server/
    config/                Database and Swagger configuration
    controllers/           Request handlers
    middleware/            Auth, RBAC, rate limiting, error handling
    models/                Mongoose data models
    routes/                Express route definitions
    utils/                 Email, cache, audit helper utilities
    Dockerfile             Backend Docker image
    package.json           Backend dependencies and scripts
    seed.js                Demo data seed script
    server.js              Express application entry point

  .github/workflows/
    ci.yml                 GitHub Actions CI pipeline
    cd.yml                 GitHub Actions CD pipeline

  Jenkinsfile              Optional Jenkins CI/CD pipeline
  docker-compose.yml       Local container setup
  render.yaml              Render backend deployment configuration
  SYSTEM_DESIGN.md         System design notes and diagrams
  README.md                Project guide
```

## How The Application Works

The frontend is a Vite React application. It renders the dashboard, tables, forms, charts, authentication pages, and protected pages. When the frontend needs data, it sends HTTP requests to the backend API.

The backend is an Express.js server. It exposes REST API routes under `/api`, connects to MongoDB through Mongoose, validates authentication tokens, applies role permissions, and returns JSON responses to the frontend.

MongoDB stores the application data, including users, vendors, purchase orders, invoices, payments, inventory records, contracts, budgets, notifications, audit logs, sessions, and finance records.

A normal request works like this:

1. The user opens the Vercel frontend.
2. The frontend reads `VITE_API_URL` to know the backend API URL.
3. The user logs in through `/api/auth/login`.
4. The backend verifies the email and password.
5. The backend returns a JWT token.
6. The frontend stores the token in the user session.
7. Future API requests include `Authorization: Bearer <token>`.
8. Backend middleware verifies the token and loads the user.
9. Role middleware checks whether the user can access the route.
10. The controller reads or writes MongoDB data and returns a response.

## Local Development

### Prerequisites

Install these before running the project locally:

- Node.js 20.19 or newer for the frontend
- Node.js 18 or newer for the backend
- MongoDB locally, or a MongoDB Atlas connection string
- Git

### Install Dependencies

```bash
git clone <repo-url>
cd vendor-system

cd server
npm install

cd ../client
npm install
```

### Backend Environment

Create `server/.env` from `server/.env.example`.

Minimum local backend variables:

```env
MONGODB_URI=mongodb://localhost:27017/vendor_po_manager
JWT_SECRET=your-local-secret
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
ALLOW_PUBLIC_REGISTRATION=true
```

The backend supports both `MONGODB_URI` and `MONGO_URI`, but `MONGODB_URI` is preferred because it is also used in Docker, Render, and CI.

Email variables are optional. If SMTP settings are not provided, the email service can fall back to a test configuration depending on the implementation.

### Frontend Environment

Create `client/.env` from `client/.env.example`.

Local frontend variable:

```env
VITE_API_URL=http://localhost:5000/api
```

In production, this should point to the deployed Render backend:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

### Seed Demo Data

Run this from the `server` directory:

```bash
node seed.js
```

The seed script creates demo users and sample procurement data.

Default demo admin account:

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@vendor.com | admin123 |

Do not use these demo credentials as real production credentials.

### Start The Application

Start the backend:

```bash
cd server
node server.js
```

Backend URL:

```text
http://localhost:5000
```

Start the frontend:

```bash
cd client
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Health check:

```text
http://localhost:5000/api/health
```

Swagger API documentation:

```text
http://localhost:5000/api/docs
```

## Main Features

### Vendor Management

The vendor module stores vendor details, contact information, tax identifiers, ratings, performance score, risk score, and item pricing. This allows the organization to compare vendors and make purchasing decisions based on cost and performance.

### Purchase Order Management

The purchase order module supports multi-item purchase orders, vendor association, approval status, delivery tracking, recurring purchase orders, and late-delivery tracking.

### Invoice And Payment Management

Invoices can be tracked with paid, unpaid, and partially paid states. Payment records connect financial activity to purchase and invoice workflows.

### Dashboard And Analytics

The dashboard gives summary counts, outstanding payments, overdue invoices, vendor performance, purchase trends, and other useful business information.

Analytics features include spend distribution, payment aging, reliability ranking, forecasting, anomaly detection, and vendor comparison.

### Inventory Management

Inventory records support stock tracking, reorder points, and scheduled checks. The backend contains cron-based logic to check reorder points periodically.

### Contracts And Budgets

Contracts help track vendor agreements and expiry. Budgets help monitor allocated and used amounts across financial categories.

### Notifications

The project uses Socket.io for real-time notifications. When notification events are generated, connected frontend clients can receive updates without refreshing the page.

### Audit Logging

Audit logs record important create, update, and delete actions. This is useful for accountability and compliance.

### Authentication And RBAC

Authentication is based on JWT. After login, the backend returns a signed token. The frontend sends that token with protected requests. Backend middleware verifies the token and checks role permissions before allowing access.

## API Overview

| Area | Route Prefix | Access |
| --- | --- | --- |
| Authentication | `/api/auth` | Public and authenticated user routes |
| Users | `/api/users` | Admin |
| Vendors | `/api/vendors` | Admin, Manager, read-only where allowed |
| Purchase Orders | `/api/purchase-orders` | Admin, Manager, read-only where allowed |
| Invoices | `/api/invoices` | Admin, Accountant, read-only where allowed |
| Dashboard | `/api/dashboard` | Authenticated users |
| Analytics | `/api/analytics` | Admin, Manager, Accountant |
| Budgets | `/api/budgets` | Admin, Manager, Accountant |
| Audit Logs | `/api/audit-logs` | Admin |
| Notifications | `/api/notifications` | Authenticated users |
| Import | `/api/import` | Admin, Manager |
| Export | `/api/export` | Role-based |
| Contracts | `/api/contracts` | Admin, Manager, read-only where allowed |
| Inventory | `/api/inventory` | Admin, Manager, read-only where allowed |
| Webhooks | `/api/webhooks` | Admin |
| Payments | `/api/payments` | Admin, Accountant |
| Finance | `/api/finance` | Role-based |
| Accounting | `/api/accounting` | Role-based |
| Search | `/api/search` | Authenticated users |

## Role Permissions Summary

| Page | Admin | Manager | Accountant | Viewer |
| --- | --- | --- | --- | --- |
| Dashboard | Full | Full | Full | View |
| Vendors | Full | Full | No access or read-only based on route | View where allowed |
| Purchase Orders | Full | Full | No access or read-only based on route | View where allowed |
| Invoices | Full | Limited | Full | View where allowed |
| Contracts | Full | Full | No access or read-only based on route | View where allowed |
| Inventory | Full | Full | No access or read-only based on route | View where allowed |
| Budgets | Full | Full | Full | No access |
| Analytics | Full | Full | Full | No access |
| Forecasting | Full | Full | No access | No access |
| Vendor Compare | Full | Full | No access | No access |
| User Management | Full | No access | No access | No access |
| Audit Logs | Full | No access | No access | No access |

The exact behavior is controlled by backend route middleware and frontend protected routes.

## Production Deployment

The project is designed for this deployment layout:

```text
Vercel frontend
  calls
Render backend
  connects to
MongoDB Atlas
```

### Render Backend

Render runs the Express backend.

The `render.yaml` file defines:

```yaml
buildCommand: cd server && npm ci
startCommand: cd server && node server.js
```

Required Render environment variables:

```text
MONGODB_URI
JWT_SECRET
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
ALLOW_PUBLIC_REGISTRATION=false
```

Optional Render environment variables:

```text
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

`FRONTEND_URL` is important because the backend uses it for CORS and frontend-facing links. If it is wrong, the browser may block frontend requests with a CORS error.

### Vercel Frontend

Vercel runs the React frontend.

Important frontend production variable:

```text
VITE_API_URL=https://your-render-service.onrender.com/api
```

The `client/vercel.json` file sends all frontend routes back to `index.html`. This is needed because React Router handles routes on the client side. Without this rewrite, refreshing a nested page could return a 404 from Vercel.

## Docker

The repository includes Docker support for local or container-based deployment.

Start all services:

```bash
docker compose up --build
```

This starts:

- MongoDB on port `27017`
- Backend API on port `5000`
- Frontend on port `3000`

The backend service depends on MongoDB health. The frontend service depends on the backend health check. Volumes are used for MongoDB data and backend uploads.

The backend Dockerfile builds a Node.js runtime image and starts `server.js`.

The frontend Dockerfile uses a multi-stage build:

1. A Node.js stage installs dependencies and builds the Vite app.
2. An Nginx stage serves the generated `dist` folder.

Docker is useful because it proves the application can run in a predictable environment even when the main live deployment uses Vercel and Render.

## GitHub Actions CI

The CI pipeline is defined in:

```text
.github/workflows/ci.yml
```

It runs on:

- Pushes to `main`
- Pushes to `develop`
- Pull requests targeting `main`

The CI pipeline has three main jobs.

### Server Job

The server job runs on an Ubuntu runner and starts a MongoDB service container. It then works inside the `server` directory.

It performs these checks:

1. Checks out the repository.
2. Installs Node.js.
3. Runs `npm ci` for clean dependency installation.
4. Runs `node --check server.js` to catch syntax errors.
5. Runs `node seed.js` against the CI MongoDB database.
6. Starts the backend on port `5050`.
7. Calls `/api/health`.
8. Logs in with the seeded admin user.
9. Extracts the JWT token.
10. Calls an authenticated dashboard API route.

This confirms that the backend can install, start, connect to MongoDB, authenticate users, and serve protected API requests.

### Client Job

The client job works inside the `client` directory.

It performs these checks:

1. Checks out the repository.
2. Installs Node.js.
3. Runs `npm ci`.
4. Runs `npm run build`.

This confirms that the React frontend can build successfully for production.

### Docker Job

The Docker job runs only after the server and client jobs pass.

It performs these checks:

1. Runs `docker compose config`.
2. Builds the backend Docker image.
3. Builds the frontend Docker image.

This confirms that the Docker configuration and Dockerfiles are valid.

## GitHub Actions CD

The CD pipeline is defined in:

```text
.github/workflows/cd.yml
```

It runs after the CI pipeline completes. It deploys only when:

- The CI pipeline succeeded.
- The branch is `main`.

It can also be started manually from the GitHub Actions page because `workflow_dispatch` is enabled.

The CD pipeline reads these GitHub repository secrets:

```text
RENDER_DEPLOY_HOOK_URL
VERCEL_DEPLOY_HOOK_URL
```

The secrets are not stored in code. GitHub injects them only while the workflow runs.

The CD pipeline calls the deployment hooks using `curl`:

```bash
curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"
curl -fsS -X POST "$VERCEL_DEPLOY_HOOK_URL"
```

When Render receives its hook call, it starts a backend redeploy. When Vercel receives its hook call, it starts a frontend redeploy.

If a hook secret is missing, that deployment step is skipped and the workflow prints a message.

## Jenkins Pipeline

The repository includes a `Jenkinsfile` so the same project can be run through Jenkins.

Jenkins is optional. GitHub Actions can already run CI/CD for this project. Jenkins is included because many companies use Jenkins as their main CI/CD server, and it is useful for learning enterprise-style pipelines.

The Jenkins pipeline performs these stages:

1. Install backend dependencies.
2. Check backend syntax.
3. Install frontend dependencies.
4. Build frontend.
5. On the `main` branch, trigger Render and Vercel deploy hooks.
6. Archive the frontend build output.

Jenkins needs these secret text credentials:

```text
render-deploy-hook-url
vercel-deploy-hook-url
```

These credentials are Jenkins-side secrets. They should not be committed to the repository.

To use Jenkins as the main CI/CD system:

1. Create a Jenkins Pipeline job.
2. Connect it to this GitHub repository.
3. Set the pipeline script path to `Jenkinsfile`.
4. Add the two Jenkins credentials listed above.
5. Add a GitHub webhook pointing to Jenkins.
6. Disable GitHub Actions deployment if you do not want duplicate deployments.

Recommended practice is to choose one primary deployment system. Use GitHub Actions or Jenkins as the main CD system, not both at the same time.

## Complete CI/CD Workflow

When GitHub Actions is the main CI/CD system, the workflow is:

```text
Developer updates code
Developer pushes to main
GitHub Actions starts CI
Backend dependencies are installed
MongoDB service starts in CI
Backend syntax is checked
Seed data is inserted
Health API is tested
Login API is tested
Authenticated dashboard API is tested
Frontend dependencies are installed
Frontend production build is created
Docker Compose config is validated
Docker images are built
If CI passes, CD starts
CD reads deploy hook secrets
CD triggers Render backend deployment
CD triggers Vercel frontend deployment
Live application updates
```

When Jenkins is the main CI/CD system, the workflow is:

```text
Developer updates code
Developer pushes to GitHub
GitHub webhook calls Jenkins
Jenkins pulls the latest code
Jenkins reads Jenkinsfile
Backend dependencies are installed
Backend syntax is checked
Frontend dependencies are installed
Frontend production build is created
Jenkins reads deploy hook credentials
Jenkins triggers Render backend deployment
Jenkins triggers Vercel frontend deployment
Live application updates
```

## Common Problems And Fixes

### Frontend Cannot Call Backend

Check `VITE_API_URL` in Vercel. It should point to the Render backend and include `/api`.

Example:

```text
https://your-render-service.onrender.com/api
```

Also check `FRONTEND_URL` in Render. It should be the Vercel frontend URL.

### CORS Error

A CORS error usually means the backend does not allow the frontend origin. Set `FRONTEND_URL` in Render to the exact Vercel URL.

### Render Backend Does Not Start

Check Render logs. Common causes are missing `MONGODB_URI`, missing `JWT_SECRET`, or an invalid MongoDB Atlas network configuration.

### Vercel Build Fails

Check Vercel logs. Common causes are broken imports, missing frontend environment variables, or dependency installation errors.

### GitHub Actions CD Says Hook Is Not Configured

Add these repository secrets in GitHub:

```text
RENDER_DEPLOY_HOOK_URL
VERCEL_DEPLOY_HOOK_URL
```

Repository secrets are added from:

```text
Settings > Secrets and variables > Actions
```

### Docker Build Fails Locally

Make sure Docker Desktop is running. If Docker Desktop is not running, local Docker builds can fail even when the repository configuration is correct.

## Project Demo Explanation

A short explanation for a project demo:

```text
This is a MERN-based vendor and purchase order management system. The React frontend is deployed on Vercel, the Express backend is deployed on Render, and MongoDB Atlas stores production data. The backend provides secured REST APIs with JWT authentication and role-based access control. The project includes CI/CD automation using GitHub Actions, and it also includes a Jenkinsfile to show how the same workflow can be moved to Jenkins. On every push to main, CI validates the backend, frontend, and Docker setup. If CI passes, CD triggers Render and Vercel deploy hooks so the live application is updated automatically.
```

## License

MIT
