# University Maintenance Service Request System (MIT 8333) — Complete Walkthrough

The **University Maintenance Service Request System** is a full-stack Next.js web application engineered for raising, managing, assigning, and auditing campus maintenance complaints. The application features zero external database dependencies (leveraging Node.js's native `node:sqlite` driver and `crypto` engine for cryptographic security), glassmorphic design aesthetics, edge route middleware protection, and multi-role dashboards for **Students/Staff**, **Maintenance Officers**, and **Administrators**.

---

## 🔑 Key Default Access Accounts

The database auto-seeds on first launch with default accounts for immediate testing across all roles:

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Student / Staff** | `student@miva.edu` | `student123` | Submit service complaints with image uploads, track personal request history, view status timelines, cancel pending tickets. |
| **Maintenance Officer** | `officer@miva.edu` | `officer123` | View assigned maintenance jobs, transition tickets to `IN_PROGRESS` or `COMPLETED`, attach resolution comments. |
| **Administrator** | `admin@miva.edu` | `admin123` | Access system-wide complaints dashboard, assign tasks to officers, manage user accounts, inspect system audit logs, export CSV reports. |

---

## ✨ System Features Implemented

### 1. Role-Based Access Control & Dashboard Views
- **Student Dashboard (`/dashboard/student`)**: Interactive metrics overview (Total, Pending, In Progress, Completed), search & filter bar, categorized ticket cards, and submission modal/page (`/dashboard/student/submit`) supporting local image file uploads.
- **Maintenance Officer Dashboard (`/dashboard/officer`)**: Clean queue of assigned work orders, instant detail view drawer, status progression tools (`IN_PROGRESS` ➔ `COMPLETED`) with required resolution notes.
- **Administrator Console (`/dashboard/admin`)**: Summary metrics, full multi-criteria filter suite (search, category, priority, status), Officer assignment modal, User Management panel (`/dashboard/admin/users`), Audit Trail (`/dashboard/admin/audit`), and one-click CSV report exporter (`/api/reports?export=csv`).

### 2. Native SQLite & Cryptography (Zero-Dependency Engine)
- **Database Engine**: Powered by Node.js native `node:sqlite` (`DatabaseSync`), storing relational schema (`dev.db`) with foreign key constraints, default index optimizations, and `ON DELETE CASCADE` actions.
- **Self-Seeding Architecture**: Tables and seed data (roles, categories, accounts, sample complaints) are auto-initialized on runtime start.
- **Cryptographic Security**: Password hashing implemented via Node's native `crypto.scryptSync` with random 16-byte salts. Session authentication uses cryptographically signed JWTs (`HMAC-SHA256`) delivered via HTTP-only, `SameSite=Lax` cookies.

### 3. Edge Security & Middleware Guard
- **Route Guard ([middleware.ts](file:///g:/My%20Drive/2026/MivaProjject/miva_ass/src/middleware.ts))**: Validates JWT session tokens on every request. Unauthenticated users are redirected to `/login`, and unauthorized role attempts (e.g., a student trying to access `/dashboard/admin`) are automatically blocked and redirected to their designated role landing page.

### 4. CSV Reports & Audit Logs
- **CSV Data Export**: Access `/api/reports?export=csv` to download spreadsheet reports containing ticket details, reporting user, assigned officer, priority, and timestamps.
- **Audit Logs**: Every status change or officer assignment creates a timestamped `StatusLog` entry visible in the Admin Audit view.

---

## 🛠️ Verification & API Endpoint Logs

During automated testing, all core REST endpoints returned success status codes (`200 OK` / `201 Created`):

```text
POST /api/auth/login                       200 OK  (Authenticated user session)
GET  /dashboard/student                    200 OK  (Loaded Student view)
POST /api/requests                         201 Created (Created maintenance ticket)
GET  /dashboard/admin                      200 OK  (Loaded Admin console)
POST /api/assignments                      200 OK  (Assigned ticket to Officer)
GET  /dashboard/officer                    200 OK  (Loaded Officer view)
PUT  /api/requests/[id]/status             200 OK  (Updated ticket to COMPLETED)
POST /api/users                            201 Created (Admin created new user)
GET  /api/reports?export=csv               200 OK  (Downloaded CSV report)
```

---

## 🚀 How to Run the Application

1. **Start Development Server**:
   ```bash
   npm run dev
   ```
2. **Open Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

3. **Log In**:
   Use any of the seed accounts listed above or register a new student account at `/register`.
