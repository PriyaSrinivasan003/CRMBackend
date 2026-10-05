# Collection Agent and Accountability System — Backend API (v1.1)

A production-grade REST API backend for a **Collection Agent and Accountability System** built with **Node.js**, **Express.js**, **MySQL 8**, **Sequelize ORM v6**, and **Sequelize CLI**.

---

## 1. System Architecture & Features

- **Multi-Tier Role-Based Access Control (RBAC)**: Enforces database-backed role codes (`ADMIN`, `SUPERVISOR`, `FIELD_AGENT`).
- **Record-Level Ownership Checks**: Prevents unauthorized access across teams, agents, customers, and collections.
- **Dual Profile Atomic Provisioning**: Creating a supervisor or field agent generates both the `users` credentials and profile records (`supervisors` / `agents`) within a single ACID transaction.
- **Robust JWT Lifecycle**: Short-lived access tokens (15m), rotating refresh tokens (7d), SHA-256 token hashing, and cryptographic reuse detection.
- **Financial Integrity**: Real-time payment confirmation, automatic synchronization of collection balances (`amount_collected`), and duplicate receipt / transaction prevention.
- **Audit Logging**: Comprehensive login attempt auditing (`login_audits`) tracking IP, User-Agent, success status, and failure reason without logging sensitive data.
- **Database Migrations & Seeders**: Strict schema migrations via Sequelize CLI with reversible down migrations and idempotent seeders.
- **Interactive Documentation**: Swagger / OpenAPI 3.0 documentation available at `/api-docs`.

---

## 2. Technology Stack

| Component | Technology |
|---|---|
| Runtime | Node.js (v18+) |
| Framework | Express.js |
| Database | MySQL 8 |
| ORM | Sequelize ORM v6 |
| Migrations & Seeders | Sequelize CLI |
| Schema Validation | Zod |
| Security | Helmet, CORS, express-rate-limit, bcrypt |
| Authentication | JWT (jsonwebtoken) & SHA-256 rotating refresh tokens |
| Documentation | Swagger UI & OpenAPI 3.0 |
| Testing | Jest & Supertest |

---

## 3. Project Structure

```
crm1.1/
├── src/
│   ├── config/
│   │   ├── config.js               # Sequelize CLI environment configurations
│   │   ├── database.js             # Connection pool & health checker
│   │   └── env.js                  # Zod-validated environment variables
│   ├── constants/
│   │   └── statusCodes.js          # TINYINT status definitions & role codes
│   ├── docs/
│   │   └── swagger.js              # Swagger / OpenAPI 3.0 definition
│   ├── middlewares/
│   │   ├── authenticate.js         # JWT validation & active account check
│   │   ├── authorize.js            # RBAC middleware
│   │   ├── errorHandler.js         # Centralized error handler
│   │   ├── notFound.js             # 404 handler
│   │   ├── rateLimiter.js          # Rate limiters
│   │   └── validateRequest.js      # Zod request validator
│   ├── migrations/                 # 14 ordered Sequelize migrations
│   ├── models/                     # Sequelize models & associations
│   ├── modules/
│   │   ├── agents/                 # Field Agent management
│   │   ├── assignments/            # Supervisor-Agent & Customer-Agent assignments
│   │   ├── auth/                   # Authentication & token rotation
│   │   ├── branches/               # Branch management
│   │   ├── collections/            # Collection visits & due amounts
│   │   ├── customers/              # Customer records
│   │   ├── dashboard/              # Role-specific dashboard analytics
│   │   ├── payments/               # Payment processing & balance synchronization
│   │   ├── supervisors/            # Supervisor management
│   │   └── users/                  # User accounts & profile provisioning
│   ├── routes/
│   │   ├── health.routes.js        # /health & /health/ready probes
│   │   └── index.js                # Root API router
│   ├── seeders/                    # Idempotent roles, branch, and admin seeders
│   ├── utils/
│   │   ├── apiError.js             # Standard custom errors
│   │   ├── apiResponse.js          # Standardized response formatters
│   │   ├── crypto.js               # Hashing & token generators
│   │   ├── email.js                # Nodemailer email transport
│   │   ├── jwt.js                  # JWT token helpers
│   │   └── pagination.js           # Query pagination & sorting
│   ├── app.js                      # Express application setup
│   └── server.js                   # Application bootstrap & graceful shutdown
├── tests/                          # Automated Jest & Supertest integration tests
├── docs/                           # Postman collection & environment JSON
├── .env.example
├── .gitignore
├── .sequelizerc
├── package.json
└── README.md
```

---

## 4. Getting Started

### 4.1 Prerequisites
- Node.js v18 or higher
- MySQL Server 8 running locally or accessible via network

### 4.2 Installation
```bash
git clone <repository-url>
cd crm1.1
npm install
```

### 4.3 Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update the MySQL credentials and JWT secrets in `.env`:
```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
DB_HOST=localhost
DB_PORT=3306
DB_NAME=agentcollection_v1_1
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_ACCESS_SECRET=your_jwt_access_secret_min_32_chars_long
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_chars_long
INITIAL_ADMIN_EMAIL=admin@collectagent.com
INITIAL_ADMIN_PASSWORD=Admin@SecurePass2026
```

### 4.4 Database Migrations & Seeding
Create the database:
```sql
CREATE DATABASE IF NOT EXISTS agentcollection_v1_1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run migrations:
```bash
npm run db:migrate
```

Run seeders:
```bash
npm run db:seed
```

### 4.5 Run the Server
```bash
# Development mode with nodemon
npm run dev

# Production start
npm start
```

---

## 5. API Documentation

Interactive Swagger documentation is available locally at:
👉 **`http://localhost:5000/api-docs`**

Swagger JSON spec:
👉 **`http://localhost:5000/api-docs.json`**

### Postman Collection
Pre-configured Postman requests and environments are located in the `docs/` folder:
- Collection: [`docs/CollectionAgentSystem.postman_collection.json`](file:///c:/yaaCreations/crm1.1/docs/CollectionAgentSystem.postman_collection.json)
- Environment: [`docs/CollectionAgentSystem.postman_environment.json`](file:///c:/yaaCreations/crm1.1/docs/CollectionAgentSystem.postman_environment.json)

---

## 6. Endpoints Summary

### Authentication (`/api/v1/auth`)
- `POST /login` — Login with email or mobile + password
- `POST /refresh` — Rotate refresh token with reuse detection
- `POST /logout` — Revoke session refresh token
- `POST /logout-all` — Revoke all user active sessions
- `GET /me` — Get authenticated user details & profile
- `POST /change-password` — Change password & revoke other sessions
- `POST /forgot-password` — Issue password reset OTP
- `POST /reset-password` — Verify OTP and reset password
- `POST /verify-email` — Verify email OTP

### Branches (`/api/v1/branches`)
- `POST /` — Create branch (Admin)
- `GET /` — List branches with pagination & search
- `GET /:id` — Get branch details
- `PATCH /:id` — Update branch details (Admin)
- `PATCH /:id/status` — Update branch status (Admin)

### Users (`/api/v1/users`)
- `POST /` — Create User (Admin only; auto-creates Supervisor/Agent profile)
- `GET /` — List Users (Admin only; supports pagination, search, status, and role filter)
- `GET /:id` — Get User details (Admin only)
- `PATCH /:id` — Update User details (Admin only)
- `PATCH /:id/status` — Update User status (Admin only)

### Supervisors (`/api/v1/supervisors`)
- `POST /` — Create Supervisor (Admin)
- `GET /` — List Supervisors (Admin)
- `GET /:id` — Get Supervisor details (Admin or self)
- `PATCH /:id` — Update Supervisor (Admin)
- `PATCH /:id/status` — Update Supervisor status (Admin)
- `GET /:id/agents` — Get Supervisor's assigned agent team (Admin or self)

### Agents (`/api/v1/agents`)
- `POST /` — Create Agent (Admin)
- `GET /` — List Agents (Admin or Supervisor team scoping)
- `GET /:id` — Get Agent details (Admin, Supervisor, or self)
- `PATCH /:id` — Update Agent details (Admin or self permitted fields)
- `PATCH /:id/status` — Update Agent status (Admin)
- `GET /:id/customers` — Get Agent's assigned customers queue
- `GET /:id/collections` — Get Agent's collection visits

### Customers (`/api/v1/customers`)
- `POST /` — Create Customer (Admin; optional initial agent assignment)
- `GET /` — List Customers (Admin, Supervisor team, Agent assigned queue)
- `GET /:id` — Get Customer details (with record ownership check)
- `PATCH /:id` — Update Customer (Admin)
- `PATCH /:id/status` — Update Customer status (Admin)
- `GET /:id/assignments` — Customer assignment history
- `POST /:id/assignments` — Assign Customer to Field Agent (Admin, Supervisor)

### Assignments (`/api/v1/assignments`)
- `POST /agents` — Assign Agent to Supervisor (Admin)
- `GET /agents` — List Agent-Supervisor assignments (Admin)
- `PATCH /agents/:id` — Update Agent-Supervisor assignment (Admin)
- `POST /customers` — Assign Customer to Agent (Admin, Supervisor)
- `GET /customers` — List Customer-Agent assignments
- `PATCH /customers/:id` — Update Customer-Agent assignment

### Collections (`/api/v1/collections`)
- `POST /` — Record collection visit (Field Agent for assigned customer, Admin, Supervisor)
- `GET /` — List collections (with role scoping & date filters)
- `GET /summary` — Aggregate collection statistics (due, collected, outstanding)
- `GET /:id` — Get collection visit details
- `PATCH /:id` — Update collection visit

### Payments (`/api/v1/payments`)
- `POST /` — Record payment against collection (Atomic balance update)
- `GET /` — List payments (with role scoping & filters)
- `GET /:id` — Get payment details
- `POST /:id/confirm` — Confirm pending payment (Admin, Supervisor)
- `POST /:id/reverse` — Reverse payment & recalculate collection totals (Admin)

### Dashboard (`/api/v1/dashboard`)
- `GET /admin` — System-wide overview, revenue, agent counts, recent transactions
- `GET /supervisor` — Team collection performance, agent breakdown, pending visits
- `GET /agent` — Personal targets, assigned customers, today's visits, receipts

---

## 7. Running Automated Tests

Run the full automated test suite with Jest and Supertest:
```bash
npm test
```

Tests run against a dedicated `agentcollection_v1_1_test` database and test:
- Positive and negative authentication & token rotation scenarios
- Token reuse detection and session revocation
- Role-based permissions and ownership checks
- Multi-table transactions and rollbacks
- Collection balance synchronization and payment reversals
- Unique constraints and duplicate transaction prevention
