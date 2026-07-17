# 🐳 Docker Containerization Guide
## University Maintenance Service Request System (MIT 8333)

This guide details how to build, run, and orchestrate the application inside isolated **Docker** containers using **Docker Compose**.

The containerized setup launches two interconnected services:
1. **`web`**: Optimized multi-stage Next.js production web application container running on port `3000`.
2. **`db`**: Official MySQL 8.0 database container running on port `3306` with persistent storage volumes.

---

## 📋 Prerequisites

- **Docker Desktop** (Windows/macOS) or **Docker Engine & Docker Compose** (Linux).
- Verify installation:
  ```bash
  docker --version
  docker compose version
  ```

---

## 🚀 Quick Start (Single Command Launch)

To build the images, create persistent volumes, launch MySQL, auto-seed database tables, and start the web application in detached background mode:

```bash
docker compose up --build -d
```

---

## 🔍 Verifying Deployment

1. **Check Container Status**:
   ```bash
   docker compose ps
   ```
   *Expected Output*:
   - `miva_mysql_db` ➔ `healthy` (Port 3306)
   - `miva_web_app` ➔ `running` (Port 3000)

2. **Access Application**:
   Open your browser at [http://localhost:3000](http://localhost:3000).

3. **Log In with Seed Accounts**:
   - **Student / Staff**: `student@miva.edu` / `student123`
   - **Maintenance Officer**: `officer@miva.edu` / `officer123`
   - **Administrator**: `admin@miva.edu` / `admin123`

---

## 📊 Useful Docker Management Commands

### View Live Application Logs
```bash
docker compose logs -f web
```

### View Live MySQL Database Logs
```bash
docker compose logs -f db
```

### Stop Application (Keep Data Volumes Intact)
```bash
docker compose down
```

### Stop Application & Reset Database Data Volumes
```bash
docker compose down -v
```

### Rebuild Containers After Code Changes
```bash
docker compose up --build -d
```

---

## 💾 Data Persistence Architecture

The `docker-compose.yml` configuration uses local named Docker volumes to guarantee zero data loss across container restarts:

1. **`mysql_data`**: Stores MySQL tables, user credentials, service complaints, assignments, and audit logs.
2. **`uploads_data`**: Stores user-uploaded complaint image files at `/app/public/uploads`.
