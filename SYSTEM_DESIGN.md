# System Design — Vendor & PO Manager (Enterprise SaaS v3.0)

## ER Diagram

```mermaid
erDiagram
    Organization ||--o{ User : has
    Organization ||--o{ Vendor : owns
    Organization ||--o{ PurchaseOrder : owns
    Organization ||--o{ Invoice : owns
    Organization ||--o{ Budget : defines
    Organization ||--o{ Notification : receives
    Organization ||--o{ Contract : manages
    Organization ||--o{ Inventory : tracks
    Organization ||--o{ Webhook : configures

    User ||--o{ PurchaseOrder : creates
    User ||--o{ AuditLog : performs
    User ||--o{ Session : opens
    Vendor ||--o{ PurchaseOrder : fulfills
    Vendor ||--o{ Invoice : billed_by
    Vendor ||--o{ Contract : bound_by
    Vendor ||--o{ Inventory : "preferred for"
    PurchaseOrder ||--o{ Invoice : generates
    PurchaseOrder ||--o{ AuditLog : tracked_in
    Invoice ||--o{ AuditLog : tracked_in

    User {
        string name
        string email
        string password
        string role
        boolean enable2FA
        ObjectId organizationId
    }
    Vendor {
        string name
        string contactPerson
        string phone
        string email
        number rating
        number performanceScore
        string riskIndex
        array itemPrices
        ObjectId organizationId
    }
    PurchaseOrder {
        string poNumber
        ObjectId vendor
        array items
        number totalAmount
        string status
        string approvalStatus
        array approvalHistory
        string department
        boolean isRecurring
        string recurringInterval
        ObjectId organizationId
    }
    Invoice {
        string invoiceNumber
        number amount
        number paidAmount
        number outstandingAmount
        string paymentStatus
        date dueDate
        ObjectId organizationId
    }
    Budget {
        string department
        number monthlyLimit
        ObjectId organizationId
    }
    AuditLog {
        ObjectId user
        string action
        string entityType
        ObjectId entityId
        object metadata
    }
    Notification {
        ObjectId user
        string type
        string message
        boolean read
    }
    Contract {
        ObjectId vendor
        string title
        string contractNumber
        date startDate
        date endDate
        number value
        string status
        boolean renewalReminder
    }
    Inventory {
        string itemName
        string sku
        number currentStock
        number reorderPoint
        number reorderQty
        boolean autoReorder
        ObjectId preferredVendor
    }
    Session {
        ObjectId user
        string token
        string ipAddress
        string userAgent
        boolean isActive
        date lastActivity
    }
    Webhook {
        string name
        string url
        array events
        string secret
        boolean isActive
        number failCount
    }
```

## Architecture Diagram

```mermaid
graph TB
    subgraph Client["Frontend (React + Vite) — 13 Pages"]
        UI[React Components]
        RC[Contexts<br/>Auth + Theme 3-Mode]
        RR[React Router — 13 Routes]
        WS[Socket.io Client]
    end

    subgraph Server["Backend (Node.js + Express)"]
        MW[Middleware<br/>Auth / RBAC / Rate Limit]
        RT[16 Route Files]
        CT[15+ Controllers]
        MD[12 Models<br/>Mongoose ODM]
        UT[Utilities<br/>Audit / Cache / PDF / Email]
        SK[Socket.io Server]
        CR[3 Cron Jobs<br/>Notifications / Recurring PO / Auto-Reorder]
    end

    subgraph DB["Database"]
        MG[(MongoDB Atlas)]
    end

    subgraph External["External Services"]
        SW[Swagger UI<br/>/api/docs]
        EM[SMTP / Ethereal<br/>Email Service]
        WH[Webhook<br/>Endpoints]
    end

    UI --> RC --> RR
    UI <--> WS
    RR --> MW --> RT --> CT --> MD --> MG
    CT --> UT
    UT --> EM
    CT --> WH
    SK <--> WS
    SK --> CT
    CR --> CT
    RT --> SW
```

## API Routes (16 Files)

| Route File | Prefix | Endpoints | RBAC |
|------------|--------|-----------|------|
| `authRoutes.js` | `/api/auth` | login, register, me, 2FA | Public/Protected |
| `userRoutes.js` | `/api/users` | CRUD, reset-password | Admin only |
| `vendorRoutes.js` | `/api/vendors` | CRUD, performance, compare, suggest | Admin, Manager |
| `poRoutes.js` | `/api/purchase-orders` | CRUD, approve/reject | Admin, Manager |
| `invoiceRoutes.js` | `/api/invoices` | CRUD, record-payment | Admin, Accountant |
| `dashboardRoutes.js` | `/api/dashboard` | stats | All authenticated |
| `analyticsRoutes.js` | `/api/analytics` | aging, spend, growth, reliability, forecast, anomalies, compliance | Admin, Manager |
| `budgetRoutes.js` | `/api/budgets` | CRUD, utilization | Admin, Manager |
| `auditRoutes.js` | `/api/audit-logs` | list | Admin only |
| `notificationRoutes.js` | `/api/notifications` | list, mark-read | All authenticated |
| `importRoutes.js` | `/api/import` | CSV import | Admin, Manager |
| `exportRoutes.js` | `/api/export` | Excel export (vendors/POs/invoices/audit) | Role-based |
| `contractRoutes.js` | `/api/contracts` | CRUD with expiry tracking | Admin, Manager |
| `inventoryRoutes.js` | `/api/inventory` | CRUD with stock status | Admin, Manager |
| `webhookRoutes.js` | `/api/webhooks` | CRUD, event config | Admin only |

## Frontend Pages (13 Routes)

| Page | Route | Section |
|------|-------|---------|
| Dashboard | `/` | Main Menu |
| Vendors | `/vendors` | Main Menu |
| Purchase Orders | `/purchase-orders` | Main Menu |
| Invoices | `/invoices` | Main Menu |
| Kanban Board | `/kanban` | Main Menu |
| Contracts | `/contracts` | Management |
| Inventory | `/inventory` | Management |
| Budgets | `/budgets` | Management |
| Analytics | `/analytics` | Intelligence |
| Forecasting | `/forecast` | Intelligence |
| Vendor Compare | `/vendor-compare` | Intelligence |
| User Management | `/users` | Administration |
| Audit Logs | `/audit-logs` | Administration |

## API Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Middleware
    participant R as Router
    participant CT as Controller
    participant DB as MongoDB
    participant EM as Email Service
    participant WH as Webhooks

    C->>M: HTTP Request + JWT Token
    M->>M: Verify JWT (auth.js)
    M->>M: Check Role (rbac.js)
    M->>M: Rate Limit Check
    M->>R: Route to handler
    R->>CT: Execute controller
    CT->>DB: Query/Mutate
    DB-->>CT: Result
    CT->>CT: Audit Log (async)
    CT-->>EM: Email (if applicable)
    CT-->>WH: Fire webhook (if configured)
    CT-->>C: JSON Response
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    participant DB as MongoDB

    U->>C: Enter credentials
    C->>S: POST /api/auth/login
    S->>DB: Find user by email
    DB-->>S: User document
    S->>S: Compare password (bcrypt)
    alt 2FA Enabled
        S-->>C: { requires2FA: true, tempToken }
        C->>U: Show OTP input
        U->>C: Enter OTP
        C->>S: POST /api/auth/verify-2fa
        S->>S: Verify TOTP (speakeasy)
    end
    S->>S: Generate JWT (id + role)
    S-->>C: { token, user, role }
    C->>C: Store in AuthContext + localStorage
    C->>U: Redirect to Dashboard
```

## Data Lifecycle

```mermaid
graph LR
    A[Create PO<br/>Draft] --> B[Submit PO<br/>Submitted]
    B --> C{Approval}
    C -->|Approved| D[PO Approved]
    C -->|Rejected| E[PO Rejected]
    E --> A
    D --> F[Delivery]
    F --> G{On Time?}
    G -->|Yes| H[Delivered]
    G -->|Late| I[Late Delivery<br/>Notification + Email]
    I --> H
    H --> J[Generate Invoice]
    J --> K[Payment]
    K --> L{Full Payment?}
    L -->|Partial| M[Partial Payment]
    M --> K
    L -->|Full| N[Invoice Paid<br/>Webhook Fired]

    style A fill:#6366f1,color:#fff
    style D fill:#10b981,color:#fff
    style E fill:#ef4444,color:#fff
    style H fill:#10b981,color:#fff
    style N fill:#10b981,color:#fff
    style I fill:#f59e0b,color:#fff
```

## Inventory Auto-Reorder Flow

```mermaid
graph LR
    CR[Cron Job<br/>Every 6 Hours] --> CHK{Stock <= Reorder Point?}
    CHK -->|Yes| PV{Preferred Vendor?}
    PV -->|Yes| DUP{Recent PO Exists?}
    DUP -->|No| GEN[Auto-Generate PO]
    DUP -->|Yes| SKIP[Skip]
    PV -->|No| SKIP
    CHK -->|No| OK[Stock OK]
    GEN --> LOG[Audit Log Entry]

    style GEN fill:#6366f1,color:#fff
    style SKIP fill:#94a3b8,color:#fff
    style OK fill:#10b981,color:#fff
```

## RBAC Permissions Matrix

| Permission | Admin | Manager | Accountant | Viewer |
|------------|:-----:|:-------:|:----------:|:------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Vendors (Read/Write) | ✅/✅ | ✅/✅ | ❌/❌ | ✅/❌ |
| Purchase Orders (Read/Write) | ✅/✅ | ✅/✅ | ❌/❌ | ✅/❌ |
| Invoices (Read/Write) | ✅/✅ | ❌/❌ | ✅/✅ | ✅/❌ |
| Analytics | ✅ | ✅ | ✅ | ❌ |
| Budgets | ✅ | ✅ | ✅ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ |
| Contracts | ✅ | ✅ | ❌ | ✅ |
| Inventory | ✅ | ✅ | ❌ | ✅ |
| Kanban Board | ✅ | ✅ | ❌ | ✅ |
| Forecasting | ✅ | ✅ | ❌ | ❌ |
| Vendor Compare | ✅ | ✅ | ❌ | ❌ |

## Cron Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| Notification Generation | Every hour | Check overdue invoices, late deliveries, budget alerts |
| Recurring PO Generation | Daily midnight | Clone delivered recurring POs based on interval |
| Inventory Auto-Reorder | Every 6 hours | Generate POs for items below reorder point |

## Scaling Strategy

| Layer | Strategy |
|-------|----------|
| **Database** | MongoDB Atlas with replica sets, sharding by organizationId |
| **Backend** | Horizontal scaling behind load balancer (PM2 cluster mode) |
| **Frontend** | CDN deployment (Vercel/CloudFront) |
| **Caching** | Node-Cache (single instance) → Redis (multi-instance) |
| **WebSockets** | Socket.io with Redis adapter for multi-server |
| **File Storage** | Local → S3/Cloudinary migration |
| **Search** | MongoDB text indexes → Elasticsearch for advanced search |
| **Email** | Ethereal (dev) → SendGrid/SES (production) |
| **Webhooks** | In-process HTTP → Message queue (RabbitMQ/SQS) |

## Security Strategy

| Concern | Implementation |
|---------|---------------|
| **Authentication** | JWT with 30-day expiry, bcrypt password hashing |
| **Authorization** | 4-role RBAC middleware (admin/manager/accountant/viewer) |
| **Rate Limiting** | 200 req/15min API, 20 req/15min auth endpoints |
| **Multi-Tenancy** | organizationId on all documents, query-level isolation |
| **Input Validation** | Mongoose schema validation, required fields |
| **File Upload** | PDF-only validation, Multer size limits |
| **2FA** | TOTP via speakeasy (RFC 6238) |
| **Headers** | X-Frame-Options: DENY, X-Content-Type-Options: nosniff |
| **Sessions** | Tracked with IP/User-Agent, 30-day TTL auto-cleanup |
| **Password Policy** | Minimum 6 characters, admin-initiated resets |
| **Audit Trail** | Every CREATE/UPDATE/DELETE logged with user + metadata |

## Performance Considerations

| Area | Optimization |
|------|-------------|
| **Database** | Indexes on poNumber, vendor, dueDate, status, organizationId, endDate, currentStock |
| **Queries** | `.lean()` on read-heavy endpoints (list/search) |
| **Caching** | Dashboard stats cached 60s via node-cache |
| **Pagination** | All list endpoints paginated (default 10-20 per page) |
| **Frontend** | Code splitting via React lazy loading |
| **Assets** | Vite build with tree-shaking and minification |
| **API** | Rate limiting prevents abuse, Socket.io for real-time |
| **Export** | Streaming Excel generation via ExcelJS (no full-memory load) |
| **Forecasting** | Linear regression runs on aggregated monthly data (O(n)) |

## Feature Count (45 Total)

| Phase | Features | Count |
|-------|----------|:-----:|
| **A** | Auth, CRUD (Vendors/POs/Invoices), Dashboard, Dark Mode, 2FA, Real-time, Pagination | 10 |
| **B** | RBAC, Audit Logs, Budgets, Analytics (4 reports), Notifications, Recurring POs, CSV Import, Docker, CI/CD, Swagger | 10 |
| **C1** | User Management, Email Notifications, Data Export, Advanced Search, Dashboard Widgets | 5 |
| **C2** | Spend Forecasting, Anomaly Detection, Report Builder, Vendor Compare, KPI Scorecards | 5 |
| **C3** | Session Management, IP Whitelisting, Encryption, Compliance Reports, Password Policies | 5 |
| **C4** | Multi-Level Approvals, Contracts, Auto PO, Vendor Portal, Webhooks | 5 |
| **C5** | Kanban Board, System Theme, i18n, PWA, Onboarding Tour | 5 |
