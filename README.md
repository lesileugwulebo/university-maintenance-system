# 🏛️ University Maintenance Service Request System (MIT 8333)
**Institution**: MIVA Open University  
**Project**: Maintenance Complaint Management & Work Order Tracking Portal  
**GitHub Repository**: [lesileugwulebo/university-maintenance-system](https://github.com/lesileugwulebo/university-maintenance-system)

---

## 📖 Master System Overview

The **University Maintenance Service Request System** is a full-stack, enterprise-grade web application built to digitize, route, track, and report campus maintenance complaints for students, staff, technicians, and administrators.

---

## ⚡ Tech Stack & Architecture

- **Frontend**: Next.js 16 (App Router), React 19, Vanilla CSS Modules (Glassmorphism Dark Theme, custom CSS variables, responsive layout grids).
- **Backend**: Node.js v22 Next.js Route Handlers (`/api/*`).
- **Database Engine**: Relational **MySQL 8.0** (`mysql2/promise` connection pool) with lazy-instantiated SQLite fallback (`node:sqlite`).
- **Authentication**: `HMAC-SHA256` signed JWTs in HTTP-only, `SameSite=Lax` cookies with `scryptSync` salted password hashing.
- **Authorization**: Next.js Edge Middleware (`middleware.ts`) enforcing Role-Based Access Control (RBAC).
- **Containerization**: Multi-stage production `Dockerfile` and `docker-compose.yml` with persistent named data volumes (`mysql_data`, `uploads_data`).
- **Automation**: 1-click Linux deployment script (`deploy.sh`) with auto-installer for Docker Engine.

---

## 🚀 Quick Start Guide

### Option 1: Automated 1-Click Linux Deployment (Recommended)
On any clean Ubuntu / Debian Linux server:
```bash
git clone https://github.com/lesileugwulebo/university-maintenance-system.git miva_ass
cd miva_ass
chmod +x deploy.sh && ./deploy.sh
```
*(Custom IP/URL support: `HOST_IP=localhost ./deploy.sh` or `HOST_IP=yourdomain.com ./deploy.sh`)*

### Option 2: Docker Compose (Local or Cloud)
```bash
docker compose up --build -d
```

### Option 3: Local Node.js Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Seed Accounts

| Role | Email | Password | Allowed Dashboards |
| :--- | :--- | :--- | :--- |
| **Student / Staff** | `student@miva.edu` | `student123` | `/dashboard/student` |
| **Maintenance Officer** | `officer@miva.edu` | `officer123` | `/dashboard/officer` |
| **Administrator** | `admin@miva.edu` | `admin123` | `/dashboard/admin`, `/dashboard/admin/users` |

---

## 📚 Documentation Index

| Document | Description | Path |
| :--- | :--- | :--- |
| 🎓 **Academic Technical Report** | Full academic report with problem statement, system objectives, requirement analysis, ER schema, API reference, screenshots, test results, and deployment details. | [TECHNICAL_PROJECT_REPORT.md](file:///g:/My%20Drive/2026/MivaProjject/miva_ass/TECHNICAL_PROJECT_REPORT.md) |
| 🐳 **Docker Containerization Guide** | Guide for multi-stage Docker build, persistent volumes, non-root permissions, and `docker-compose.yml`. | [DOCKER_CONTAINER_GUIDE.md](file:///g:/My%20Drive/2026/MivaProjject/miva_ass/DOCKER_CONTAINER_GUIDE.md) |
| 🐧 **Ubuntu Docker Deployment** | Step-by-step guide for hosting on Ubuntu Linux using Docker Compose and `deploy.sh`. | [UBUNTU_DOCKER_DEPLOYMENT_GUIDE.md](file:///g:/My%20Drive/2026/MivaProjject/miva_ass/UBUNTU_DOCKER_DEPLOYMENT_GUIDE.md) |
| ☁️ **AWS EC2 Hosting Guide** | Detailed guide for launching AWS EC2 Ubuntu instances, configuring Security Groups, Nginx, and PM2. | [AWS_EC2_DEPLOYMENT_GUIDE.md](file:///g:/My%20Drive/2026/MivaProjject/miva_ass/AWS_EC2_DEPLOYMENT_GUIDE.md) |
| 📦 **Amazon ECR Guide** | Step-by-step instructions for publishing Docker images to Amazon ECR and pulling on production servers. | [AWS_ECR_DEPLOYMENT_GUIDE.md](file:///g:/My%20Drive/2026/MivaProjject/miva_ass/AWS_ECR_DEPLOYMENT_GUIDE.md) |
| 🛠️ **Linux Manual Guide** | Non-containerized Linux deployment guide using Node.js, PM2, MySQL, and Nginx. | [LINUX_DEPLOYMENT_GUIDE.md](file:///g:/My%20Drive/2026/MivaProjject/miva_ass/LINUX_DEPLOYMENT_GUIDE.md) |
| 🧪 **System Walkthrough** | Feature walkthrough with test execution evidence and UI screenshot references. | [WALKTHROUGH.md](file:///g:/My%20Drive/2026/MivaProjject/miva_ass/WALKTHROUGH.md) |

---

## 🧪 Testing & Verification

Automated integration test runner status (`tests/system-verification.js`):
- **Result**: **13 PASSED, 0 FAILED** (100% Success Rate)

---

## 📦 Project Submission Archives

- 📦 **[University_Maintenance_System_MIT8333.zip](file:///g:/My%20Drive/2026/MivaProjject/miva_ass/University_Maintenance_System_MIT8333.zip)**
- 📦 **[University_Maintenance_System_MIT8333.rar](file:///g:/My%20Drive/2026/MivaProjject/miva_ass/University_Maintenance_System_MIT8333.rar)**
