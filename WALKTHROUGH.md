# 🧪 System Verification & Feature Walkthrough
## University Maintenance Service Request System (MIT 8333)

This document details the complete feature walkthrough, security verification, database schema, and test execution results for the system.

---

## 📸 Interface Demonstration & Screenshots

### 1. Student / Staff Service Request Portal
Students and staff can log complaints, specify priority (*LOW*, *MEDIUM*, *HIGH*, *CRITICAL*), select category classification, upload photo evidence, filter personal requests, and track status timelines (`PENDING` ➔ `ASSIGNED` ➔ `IN_PROGRESS` ➔ `COMPLETED` / `CANCELLED`).

![Student Dashboard](file:///C:/Users/Anna/.gemini/antigravity-ide/brain/66a0f71a-9ffc-421c-8530-c49216f0135e/student_dashboard_screenshot_1784325057826.png)

---

### 2. Administrator Operations Console
Administrators can inspect system-wide summary analytics, search/filter all complaints, route unassigned tickets to specific Maintenance Officers, manage user accounts, inspect audit logs, and export CSV reports.

![Admin Console](file:///C:/Users/Anna/.gemini/antigravity-ide/brain/66a0f71a-9ffc-421c-8530-c49216f0135e/admin_dashboard_screenshot_1784325078183.png)

---

### 3. Maintenance Officer Work Order Drawer
Technicians can view assigned work orders, inspect problem descriptions and photo evidence, update status to `IN_PROGRESS` or `COMPLETED`, and attach timestamped resolution comments.

![Officer Drawer](file:///C:/Users/Anna/.gemini/antigravity-ide/brain/66a0f71a-9ffc-421c-8530-c49216f0135e/officer_dashboard_screenshot_1784325104208.png)

---

## 🧪 Automated Test Suite Execution Results

All 13 integration test cases in `tests/system-verification.js` were executed and passed with a **100% success rate**:

```text
====================================================
 🧪 STARTING SYSTEM VERIFICATION & API TEST SUITE
====================================================

✅ [PASS] Security: Unauthenticated API access rejected
✅ [PASS] Auth: Student login with valid credentials
✅ [PASS] Auth: Administrator login with valid credentials
✅ [PASS] Auth: Maintenance Officer login with valid credentials
✅ [PASS] Auth: /api/auth/me returns student session profile
✅ [PASS] Requests: Student can submit new maintenance request
✅ [PASS] Requests: Student lists own service complaints
✅ [PASS] Assignments: Admin routes request to Maintenance Officer
✅ [PASS] Workflow: Officer updates assigned ticket status to IN_PROGRESS
✅ [PASS] Workflow: Officer completes assigned maintenance ticket
✅ [PASS] Reports: Admin fetches metrics summary and breakdown
✅ [PASS] Reports: Admin exports CSV spreadsheet report
✅ [PASS] Users: Admin lists system users

====================================================
 🏁 TEST SUITE COMPLETED: 13 PASSED, 0 FAILED
====================================================
```

---

## 🗄️ Database Architecture & DDL

Relational MySQL database powered by `mysql2/promise` with automatic SQLite fallback in `src/lib/db.ts`:

- **`User`**: System user accounts.
- **`Role`**: Operational roles (`ADMINISTRATOR`, `MAINTENANCE_OFFICER`, `STUDENT_STAFF`).
- **`RequestCategory`**: Categories (*Faulty Electricity*, *Damaged Furniture*, *Leaking Pipes*, etc.).
- **`Request`**: Service complaints with status, priority, description, and photo paths.
- **`Assignment`**: Officer work order routing with assigner metadata.
- **`StatusLog`**: Timestamped audit trail recording every state transition.

---

## 🐳 Deployment & Containerization Options

1. **Automated 1-Click Script**: `chmod +x deploy.sh && ./deploy.sh`
2. **Docker Compose**: `docker compose up --build -d`
3. **GitHub Repository**: [lesileugwulebo/university-maintenance-system](https://github.com/lesileugwulebo/university-maintenance-system)
