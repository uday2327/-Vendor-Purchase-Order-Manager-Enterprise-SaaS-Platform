# Vendor & Purchase Order Manager — Enterprise SaaS v3.0

A full-stack MERN application for managing vendors, purchase orders, invoices, contracts, and inventory with AI-driven analytics, role-based access control, and real-time notifications.

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js, Socket.io, Nodemailer, ExcelJS |
| **Database** | MongoDB (Mongoose ODM) |
| **Auth** | JWT, bcrypt, speakeasy (2FA) |
| **DevOps** | Docker, Docker Compose, GitHub Actions CI/CD, Render/Vercel config, Swagger API Docs |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas connection string)

### 1. Clone & Install

```bash
git clone <repo-url>
cd vendor-system

# Backend
cd server
cp .env.example .env    # Edit with your values
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure Environment

Create either a root `.env` file or `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/vendor_po_manager
JWT_SECRET=your-secret-key
PORT=5000

# Email (optional — falls back to Ethereal test account)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
SMTP_FROM="Vendor Manager" <noreply@example.com>
FRONTEND_URL=http://localhost:5173
```

The backend accepts either `MONGODB_URI` or the older `MONGO_URI` name.
For frontend variables, copy `client/.env.example` to `client/.env`.
Use `VITE_API_URL=http://localhost:5000/api` locally, and point it to your deployed Render API in production.

### 3. Seed & Run

```bash
# Seed demo data (from server/)
node seed.js

# Start backend
node server.js          # → http://localhost:5000

# Start frontend (from client/)
npm run dev             # → http://localhost:5173
```

### 4. Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vendor.com | admin123 |

## 🐳 Docker

```bash
docker compose up --build
# Server → http://localhost:5000
# Client → http://localhost:3000
```

Health endpoint:
```bash
http://localhost:5000/api/health
```

## 📊 Features (45 Total)

### Core Operations
- ✅ Vendor CRUD with performance scoring & risk indexing
- ✅ Purchase Order management with multi-item line items
- ✅ Invoice tracking with partial payment support
- ✅ Contract management with expiry alerts
- ✅ Inventory tracking with auto-reorder (cron every 6h)

### Analytics & Intelligence
- ✅ Payment Aging Report (Current / 1-30 / 31-60 / 60+ days)
- ✅ Vendor Spend Distribution (pie chart)
- ✅ Monthly Growth Trend (bar chart)
- ✅ Vendor Reliability Ranking
- ✅ Spend Forecasting (3-month linear regression)
- ✅ Anomaly Detection (2σ outliers + weekend orders)
- ✅ Vendor Comparison (radar chart, up to 3 vendors)
- ✅ Compliance Reports (user activity, 2FA coverage)

### Workflow & Automation
- ✅ Multi-level PO approval workflow
- ✅ Recurring purchase orders (Weekly/Monthly/Quarterly)
- ✅ Budget management with utilization alerts
- ✅ Kanban Board (drag-and-drop PO management)
- ✅ CSV import for bulk data
- ✅ Excel export for all entities
- ✅ Email notifications (PO approval, overdue invoices, budget alerts)
- ✅ Webhook integrations (configurable event-driven HTTP POST)

### Security & Administration
- ✅ JWT authentication with 2FA (TOTP)
- ✅ 4-role RBAC (Admin, Manager, Accountant, Viewer)
- ✅ User management (CRUD, role assignment, password reset)
- ✅ Audit logging (every create/update/delete)
- ✅ Session tracking (IP, user agent, 30-day TTL)
- ✅ Rate limiting (200 req/15min API, 20 req/15min auth)

### UI/UX
- ✅ Dark / Light / System theme (auto-detects OS preference)
- ✅ Real-time notifications (Socket.io)
- ✅ Responsive sidebar with 4 sections
- ✅ Pagination, search, and filtering on all tables
- ✅ Premium glassmorphism design

## 🗂️ Project Structure

```
vendor-system/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Layout, Modal, StatsCard, NotificationBell
│   │   ├── context/           # AuthContext, ThemeContext
│   │   ├── pages/             # 13 pages (Dashboard, Vendors, POs, etc.)
│   │   ├── lib/               # Axios API instance
│   │   └── App.jsx            # Routes
│   ├── vercel.json            # Vercel SPA config
│   └── package.json
│
├── server/                    # Express backend
│   ├── config/                # db.js, swagger.js
│   ├── controllers/           # 15+ controllers
│   ├── middleware/             # auth, rbac, rateLimiter, errorHandler
│   ├── models/                # 12 Mongoose models
│   ├── routes/                # 16 route files
│   ├── utils/                 # auditLogger, emailService, cache
│   ├── server.js              # Entry point + cron jobs
│   ├── seed.js                # Demo data seeder
│   └── package.json
│
├── docker-compose.yml
├── render.yaml
├── SYSTEM_DESIGN.md           # ER, architecture, flow diagrams
└── README.md
```

## 📡 API Endpoints

| Route | Prefix | Auth |
|-------|--------|------|
| Auth | `/api/auth` | Public |
| Users | `/api/users` | Admin |
| Vendors | `/api/vendors` | Admin, Manager |
| Purchase Orders | `/api/purchase-orders` | Admin, Manager |
| Invoices | `/api/invoices` | Admin, Accountant |
| Dashboard | `/api/dashboard` | All |
| Analytics | `/api/analytics` | Admin, Manager |
| Budgets | `/api/budgets` | Admin, Manager |
| Audit Logs | `/api/audit-logs` | Admin |
| Notifications | `/api/notifications` | All |
| Import | `/api/import` | Admin, Manager |
| Export | `/api/export` | Role-based |
| Contracts | `/api/contracts` | Admin, Manager |
| Inventory | `/api/inventory` | Admin, Manager |
| Webhooks | `/api/webhooks` | Admin |

**Swagger Docs**: http://localhost:5000/api/docs

## 🔐 RBAC Permissions

| Page | Admin | Manager | Accountant | Viewer |
|------|:-----:|:-------:|:----------:|:------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Vendors | ✅ | ✅ | ❌ | 👁️ |
| Purchase Orders | ✅ | ✅ | ❌ | 👁️ |
| Invoices | ✅ | ❌ | ✅ | 👁️ |
| Kanban Board | ✅ | ✅ | ❌ | 👁️ |
| Contracts | ✅ | ✅ | ❌ | 👁️ |
| Inventory | ✅ | ✅ | ❌ | 👁️ |
| Budgets | ✅ | ✅ | ✅ | ❌ |
| Analytics | ✅ | ✅ | ✅ | ❌ |
| Forecasting | ✅ | ✅ | ❌ | ❌ |
| Vendor Compare | ✅ | ✅ | ❌ | ❌ |
| User Mgmt | ✅ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ |

👁️ = Read-only access

## 📦 Deployment

### Vercel (Frontend) + Render (Backend)
1. Push to GitHub
2. Import `server/` on Render as a Web Service
3. Import `client/` on Vercel as a Static Site
4. Set environment variables on both platforms

Recommended production variables:

- Render backend: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, optional `SMTP_*`, optional `GOOGLE_CLIENT_ID`, optional `GOOGLE_CLIENT_SECRET`
- Vercel frontend: `VITE_API_URL=https://<your-render-service>.onrender.com/api`, optional `VITE_GOOGLE_CLIENT_ID`

### Docker
```bash
docker compose up -d --build
```

## CI Pipeline

GitHub Actions runs `.github/workflows/ci.yml` on pushes and pull requests.

- Server job: installs dependencies, checks backend syntax, then starts the API and calls `/api/health`
- Client job: installs dependencies and builds the Vite frontend
- Docker job: validates `docker-compose.yml` and builds both Docker images

## CD Pipeline

GitHub Actions also includes `.github/workflows/cd.yml` for Continuous Deployment.

- CD starts after the `CI Pipeline` succeeds for the `main` branch
- The workflow can also be started manually from GitHub Actions with `workflow_dispatch`
- Backend deployment is triggered through `RENDER_DEPLOY_HOOK_URL`
- Frontend deployment is triggered through `VERCEL_DEPLOY_HOOK_URL`

Required GitHub repository secrets for CD:

- `RENDER_DEPLOY_HOOK_URL`
- `VERCEL_DEPLOY_HOOK_URL`

Simple flow:

1. Push code to `main`
2. CI checks backend, frontend, and Docker setup
3. CD triggers deploy hooks
4. Render deploys backend
5. Vercel deploys frontend

If Render/Vercel auto-deploy directly from GitHub is already enabled, this workflow still helps demonstrate a formal CD pipeline in the repository for learning and assignment review.

## 📄 License

MIT
