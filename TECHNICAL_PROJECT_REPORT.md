# 🎓 Technical Documentation & Comprehensive Project Report
## University Maintenance Service Request System (MIT 8333)
**Institution**: MIVA Open University  
**Student Name**: Leslie Ugwulebo  
**Matriculation Number**: MIVA/MIT/8333/2026  
**Department**: Department of Computer Science & Information Technology  
**Institutional Email**: leslie@miva.edu.ng  

---

## Section B: Technical Project Report

### 1.1 Introduction & Problem Statement
In higher education institutions, maintaining campus physical and technical infrastructure—lecture hall HVAC, lab electrical fittings, plumbing, and Wi-Fi access points—is vital for teaching and learning. Prior to the implementation of this system, MIVA Open University experienced severe operational bottlenecks:
- **Fragmented Communication Bottlenecks**: Complaints were submitted through informal verbal messaging, phone calls, or paper logs, leading to lost tickets and poor accountability.
- **Zero Visibility Status Tracking**: Students and staff had no digital mechanism to check whether reported faults were pending, assigned, or resolved.
- **Manual Paper-Routing Delays**: Facility managers relied on manual paper-based routing to delegate tasks to technicians, creating severe resolution delays.

---

### 1.2 System Objectives (Fulfilling 6 Primary Milestones)
The project successfully accomplished six core technical milestones:
1. **Milestone 1: Responsive Dashboard Portal**: Engineered a modern React 19 / Next.js 16 glassmorphic interface with real-time status badges, priority selectors, and file upload previews.
2. **Milestone 2: Role-Based Access Control (RBAC)**: Enforced strict role separation for Students/Staff, Maintenance Officers, and Administrators via Edge Route Middleware (`src/middleware.ts`).
3. **Milestone 3: Relational Validation Tables**: Constructed a 3NF normalized MySQL database with primary/foreign keys and constraint validation.
4. **Milestone 4: System Audit Mapping**: Implemented timestamped audit logging in `StatusLog` table recording every status transition (`PENDING` ➔ `ASSIGNED` ➔ `IN_PROGRESS` ➔ `COMPLETED`).
5. **Milestone 5: Automated Testing Integration**: Created `tests/system-verification.js` verifying all API routes with 100% test passage (13/13 passed).
6. **Milestone 6: Container Delivery**: Packaged application into a multi-stage `Dockerfile` and `docker-compose.yml` with 1-click `deploy.sh` automation.

---

### 1.3 Requirement Analysis
- **Functional Requirements**: Registration, login, request logging, photo uploads, officer routing, status resolution, audit log tracking, user management, and CSV export.
- **Non-Functional Requirements**: Sub-200ms latency, responsive glassmorphism UI, containerized portability, and zero-downtime database auto-seeding.

---

### 1.4 Architecture & Database Schema
The application implements a Three-Tier Architecture:

```text
Client Browser (React 19) ➔ App Router Guard Middleware ➔ MySQL Relational Instance (mysql2)
```

1. **Tier 1: Presentation (Client Browser)**: React 19 Client/Server Components styled with Vanilla CSS Modules delivering glassmorphic cards and priority badges.
2. **Tier 2: Application (App Router Guard Middleware)**: Next.js 16 Edge Middleware validating `HMAC-SHA256` signed JWT cookies and routing requests securely.
3. **Tier 3: Data (MySQL Relational Instance)**: Containerized MySQL 8.0 relational database engine (`mysql2` connection pool) with lazy SQLite fallback.

#### Normalization Relational Specifications:
- **`Role`**: `id` (INT PK), `name` (VARCHAR UNIQUE). Stores system permissions (`ADMINISTRATOR`, `MAINTENANCE_OFFICER`, `STUDENT_STAFF`).
- **`User`**: `id` (INT PK), `email` (VARCHAR UNIQUE), `username` (VARCHAR UNIQUE), `password`, `fullName`, `roleId` (FK ➔ `Role.id`).
- **`RequestCategory`**: `id` (INT PK), `name` (VARCHAR UNIQUE). Categories (*Faulty Electricity*, *Damaged Furniture*, *Leaking Pipes*, etc.).
- **`Request`**: `id` (INT PK), `title`, `description`, `categoryId` (FK ➔ `RequestCategory.id`), `status`, `priority`, `imagePath`, `creatorId` (FK ➔ `User.id`).
- **`Assignment`**: `id` (INT PK), `requestId` (FK ➔ `Request.id` `ON DELETE CASCADE`), `officerId` (FK ➔ `User.id`), `assignedById` (FK ➔ `User.id`).
- **`StatusLog`**: `id` (INT PK), `requestId` (FK ➔ `Request.id` `ON DELETE CASCADE`), `userId` (FK ➔ `User.id`), `previousStatus`, `newStatus`, `comment`.

---

### 1.5 Challenges Encountered & Solutions
1. **SQLite Concurrency Locks**: Mitigated by introducing `mysql2` connection pooling and lazy SQLite fallback instantiation in `src/lib/db.ts`.
2. **Docker Filesystem Permissions**: Handled by explicitly configuring non-root user permissions `chown -R nextjs:nodejs /app` inside the `Dockerfile` configuration.
3. **Turbopack Config Deprecation**: Removed deprecated `eslint` block from `next.config.ts` for Next.js 16 compatibility.

---

## Screenshots of Major Interfaces

### Student / Staff Service Request Portal
![Student Dashboard](file:///C:/Users/Anna/.gemini/antigravity-ide/brain/66a0f71a-9ffc-421c-8530-c49216f0135e/student_dashboard_screenshot_1784325057826.png)

### Administrator Operations Console
![Admin Console](file:///C:/Users/Anna/.gemini/antigravity-ide/brain/66a0f71a-9ffc-421c-8530-c49216f0135e/admin_dashboard_screenshot_1784325078183.png)

### Maintenance Officer Work Order Drawer
![Officer Drawer](file:///C:/Users/Anna/.gemini/antigravity-ide/brain/66a0f71a-9ffc-421c-8530-c49216f0135e/officer_dashboard_screenshot_1784325104208.png)

---

## Automated Testing Evidence

All 13 integration test cases passed with **100% success rate**:

```text
====================================================
 🧪 STARTING SYSTEM VERIFICATION & API TEST SUITE
====================================================

✅ [PASS] Security: Unauthenticated API access rejected (401)
✅ [PASS] Auth: Student login with valid credentials (200)
✅ [PASS] Auth: Administrator login with valid credentials (200)
✅ [PASS] Auth: Maintenance Officer login with valid credentials (200)
✅ [PASS] Auth: /api/auth/me returns student session profile (200)
✅ [PASS] Requests: Student can submit new maintenance request (201)
✅ [PASS] Requests: Student lists own service complaints (200)
✅ [PASS] Assignments: Admin routes request to Maintenance Officer (200)
✅ [PASS] Workflow: Officer updates assigned ticket status to IN_PROGRESS (200)
✅ [PASS] Workflow: Officer completes assigned maintenance ticket (200)
✅ [PASS] Reports: Admin fetches metrics summary and breakdown (200)
✅ [PASS] Reports: Admin exports CSV spreadsheet report (200)
✅ [PASS] Users: Admin lists system users (200)

====================================================
 🏁 TEST SUITE COMPLETED: 13 PASSED, 0 FAILED
====================================================
```

---

## Conclusion
The **University Maintenance Service Request System (MIT 8333)** satisfies all academic, technical, security, testing, and deployment requirements for MIVA Open University.
