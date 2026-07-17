# 🐧 Step-by-Step Guide: Running on Ubuntu Server with Docker
## University Maintenance Service Request System (MIT 8333)

This guide provides clean, copy-pasteable terminal commands to deploy and run the application on an **Ubuntu Server** that has **Docker** and **Docker Compose** pre-installed.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:
1. **SSH Access** to your Ubuntu Server (IP address or domain name).
2. **Docker** and **Docker Compose** pre-installed on the server.
   *(Verify on server by running `docker --version` and `docker compose version`).*

---

## 🚀 Step-by-Step Deployment

### Step 1: Connect to your Ubuntu Server
Open terminal or PowerShell on your computer and SSH into your server:
```bash
ssh ubuntu@YOUR_SERVER_IP
```
*(Replace `ubuntu` and `YOUR_SERVER_IP` with your actual SSH username and server IP).*

---

### Step 2: Obtain the Project Codebase
Choose **Option A** (Git Clone) or **Option B** (Archive Upload):

#### Option A: Clone from GitHub (Recommended)
```bash
cd ~
git clone https://github.com/lesileugwulebo/university-maintenance-system.git miva_ass
cd miva_ass
```

#### Option B: Upload `.zip` / `.rar` Archive from Local Computer
From your computer:
```bash
scp -i YOUR_KEY.pem University_Maintenance_System_MIT8333.zip ubuntu@YOUR_SERVER_IP:~/
```
Then inside the Ubuntu server:
```bash
sudo apt install -y unzip
unzip University_Maintenance_System_MIT8333.zip -d miva_ass
cd miva_ass
```

---

### Step 3: Launch Containers using Docker Compose
Run a single command to build the Next.js web app image, spin up the MySQL 8.0 database container, create persistent storage volumes, and start the application in background mode:

```bash
docker compose up --build -d
```

---

### Step 4: Verify Container Health & Status
Check that both the web app (`miva_web_app`) and database (`miva_mysql_db`) containers are running:

```bash
docker compose ps
```

*Expected Output*:
```text
NAME            IMAGE            COMMAND                  SERVICE   CREATED          STATUS                    PORTS
miva_mysql_db   mysql:8.0        "docker-entrypoint.s…"   db        10 seconds ago   Up 10 seconds (healthy)   0.0.0.0:3306->3306/tcp
miva_web_app    miva_ass-web     "docker-entrypoint.s…"   web       5 seconds ago    Up 5 seconds              0.0.0.0:3000->3000/tcp
```

View live application logs to confirm database auto-seeding completed:
```bash
docker compose logs -f web
```
*(Press `Ctrl+C` to stop viewing logs).*

---

### Step 5: Configure Firewall (Open Port 3000)
Allow traffic to port `3000` (and `80`/`443` for web traffic):

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

### Step 6: Access the Application
Open your web browser and navigate to:
```text
http://YOUR_SERVER_IP:3000
```

#### Default Logins:
| Role | Email | Password |
| :--- | :--- | :--- |
| **Student / Staff** | `student@miva.edu` | `student123` |
| **Maintenance Officer** | `officer@miva.edu` | `officer123` |
| **Administrator** | `admin@miva.edu` | `admin123` |

---

## 🌐 Step 7 (Optional): Set Up Nginx Reverse Proxy & SSL (Port 80 / HTTPS)

If you want visitors to access the site without typing `:3000` (e.g. `http://YOUR_SERVER_IP` or `https://yourdomain.com`), set up Nginx:

1. Install Nginx:
   ```bash
   sudo apt update && sudo apt install -y nginx
   ```
2. Create site configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/miva_maintenance
   ```
3. Paste:
   ```nginx
   server {
       listen 80;
       server_name YOUR_SERVER_IP yourdomain.com;
       client_max_body_size 10M;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```
4. Enable and reload Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/miva_maintenance /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t && sudo systemctl reload nginx
   ```
5. Enable free HTTPS/SSL (if using a domain name):
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 🛠️ Essential Docker Maintenance Commands

| Action | Command |
| :--- | :--- |
| **View Web App Logs** | `docker compose logs -f web` |
| **View Database Logs** | `docker compose logs -f db` |
| **Restart Application** | `docker compose restart` |
| **Stop Application** *(Preserves DB Data)* | `docker compose down` |
| **Stop & Clear Database Volumes** | `docker compose down -v` |
| **Rebuild Images After Code Edit** | `docker compose up --build -d` |
