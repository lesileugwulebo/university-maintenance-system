# 🏛️ University Maintenance Service Request System (MIT 8333)
## MIVA Open University — Maintenance & Facilities Portal

---

## 📌 Project Overview
The **University Maintenance Service Request System** is a full-stack Next.js web application engineered for raising, tracking, assigning, and auditing university facility complaints. The system features a zero-dependency architecture (using Node.js native `node:sqlite` database and `crypto` modules), glassmorphic UI styling, edge middleware authorization, role-based dashboards, and CSV spreadsheet report generation.

---

## 🔑 Default Access Accounts

The SQLite database (`dev.db`) auto-initializes and seeds default accounts on boot:

| Role | Email | Password | Primary Dashboard Capabilities |
| :--- | :--- | :--- | :--- |
| **Student / Staff** | `student@miva.edu` | `student123` | Log maintenance complaints, attach images, filter/search requests, view timeline, cancel pending tickets. |
| **Maintenance Officer** | `officer@miva.edu` | `officer123` | View assigned work orders, update ticket status (`IN_PROGRESS` ➔ `COMPLETED`), record resolution notes. |
| **Administrator** | `admin@miva.edu` | `admin123` | Overview metrics, route tickets to officers, user account management, view audit history, export CSV reports. |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js version `22.5.0` or higher (tested on Node v26.4.0). No external database server required.

### Installation & Execution
1. Open terminal in the project root directory.
2. Install minimal core dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
4. Access the portal in your browser:
   ```text
   http://localhost:3000
   ```

### Running Automated Test Suite
To execute the automated end-to-end integration test suite:
```bash
node tests/system-verification.js
```

---

## 📂 Project Structure

```text
miva_ass/
├── src/
│   ├── app/                    # Next.js App Router (pages & API endpoints)
│   │   ├── api/                # REST API handlers (auth, requests, assignments, users, reports)
│   │   ├── dashboard/          # Role-based dashboard views (student, officer, admin)
│   │   ├── login/              # Authentication login page
│   │   ├── register/           # Account registration page
│   │   ├── globals.css         # Global CSS imports
│   │   ├── layout.tsx          # Root HTML layout
│   │   └── page.tsx            # Main landing redirect
│   ├── components/             # Reusable UI components (Sidebar, RequestCard)
│   ├── lib/                    # Core libraries (db.ts, auth.ts, crypto.ts, upload.ts)
│   └── styles/                 # Vanilla CSS Modules (variables, main, dashboard, forms, tables)
├── public/                     # Static assets & user upload storage
├── tests/                      # Automated test scripts (system-verification.js)
├── prisma/                     # Database schema & seed reference definitions
├── TECHNICAL_PROJECT_REPORT.md # Comprehensive academic technical report (Section F)
├── WALKTHROUGH.md              # User guide & operational verification report
├── package.json                # Project configuration & dependencies
├── next.config.ts              # Next.js compiler settings
└── tsconfig.json               # TypeScript compiler configuration
```

---

## 📄 Documentation Included
- **`TECHNICAL_PROJECT_REPORT.md`**: Complete technical documentation including Problem Statement, System Objectives, Requirement Analysis, Technology Stack, ER Database Schema & Relationships, API Specifications, Test Results, and Challenges.
- **`WALKTHROUGH.md`**: Feature guide, user role summary, and verification report.
