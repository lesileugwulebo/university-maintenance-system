# 🐧 Linux Server Deployment Guide
## University Maintenance Service Request System (MIT 8333)

This guide provides step-by-step instructions to host and run the application on any Linux Virtual Machine (e.g., **Ubuntu 22.04/24.04 LTS** on AWS EC2, DigitalOcean Droplets, Google Cloud Compute Engine, or Linode).

Because the application utilizes Node's native `node:sqlite` database driver and built-in `crypto` modules, **no external database server (like MySQL or PostgreSQL) needs to be installed**. The SQLite database runs directly inside the Node.js process at native C++ memory speeds.

---

## 📋 System Prerequisites

| Component | Minimum Version | Purpose |
| :--- | :--- | :--- |
| **Linux OS** | Ubuntu 20.04 / 22.04 / 24.04 LTS | Operating System |
| **Node.js** | v22.5.0 or higher (v22 / v24 / v26) | Node runtime with native `node:sqlite` support |
| **PM2** | Latest | Production process manager & auto-restart on boot |
| **Nginx** | Latest | High-performance Web server & Reverse Proxy |
| **Certbot** | Latest | Free SSL/TLS HTTPS Certificates (Let's Encrypt) |

---

## 🚀 Step-by-Step Deployment Procedure

### Step 1: Connect to Server & Update System
Connect to your cloud instance via SSH:
```bash
ssh ubuntu@YOUR_SERVER_PUBLIC_IP
```
Update system packages:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ufw
```

---

### Step 2: Install Node.js (NodeSource Repository)
Install Node.js (v22 LTS or v24):
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```
Verify installation (must be `>= 22.5.0`):
```bash
node -v   # Expected: v22.x.x or higher
npm -v
```

---

### Step 3: Transfer Codebase & Install Dependencies
Clone your repository or upload the `.tar.gz` / `.zip` archive:
```bash
cd /var/www
sudo git clone https://github.com/your-repo/miva_ass.git
# Or extract your compressed submission package here
```
Set proper directory permissions:
```bash
sudo chown -R $USER:$USER /var/www/miva_ass
cd /var/www/miva_ass
```
Install production dependencies:
```bash
npm install --omit=dev
```

---

### Step 4: Build Production Application
Compile the Next.js production bundle:
```bash
npm run build
```
*(This generates the optimized `.next` build directory and static assets).*

---

### Step 5: Configure PM2 Process Manager
Install PM2 globally to keep the Next.js server running in the background and auto-restart on server reboot:
```bash
sudo npm install -g pm2
```
Start the application using PM2:
```bash
pm2 start npm --name "miva-maintenance" -- run start
```
Configure PM2 to automatically launch on server reboot:
```bash
pm2 startup
```
Copy and execute the exact command printed in your terminal by `pm2 startup`, then save the process list:
```bash
pm2 save
```
Check status:
```bash
pm2 status
```

---

### Step 6: Configure Nginx Reverse Proxy
Install Nginx:
```bash
sudo apt install -y nginx
```
Create an Nginx configuration file for the application:
```bash
sudo nano /etc/nginx/sites-available/miva_maintenance
```
Paste the following configuration (replace `yourdomain.com` with your actual domain name or server IP):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Maximum file upload size (e.g. 10MB for complaint images)
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable the configuration and disable the default site:
```bash
sudo ln -s /etc/nginx/sites-available/miva_maintenance /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```
Test Nginx syntax and restart:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

### Step 7: Configure Firewall (UFW)
Allow SSH, HTTP, and HTTPS traffic:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

### Step 8: Enable Free HTTPS/SSL Certificate (Certbot)
Install Certbot and the Nginx plugin:
```bash
sudo apt install -y certbot python3-certbot-nginx
```
Obtain and install SSL certificate automatically:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Follow the prompts. Certbot will automatically rewrite your Nginx configuration to enforce secure HTTPS (`https://yourdomain.com`).

---

## 🗄️ Database & Upload Persistence Notes

1. **Database Path**: The SQLite database file `dev.db` is located at `/var/www/miva_ass/dev.db`.
2. **Backups**: To back up your database, simply run a scheduled cron job or copy `dev.db`:
   ```bash
   cp /var/www/miva_ass/dev.db /var/backups/miva_dev_$(date +%F).db
   ```
3. **Uploads Directory**: Images uploaded by students are stored in `/var/www/miva_ass/public/uploads/`. Ensure Node has write access:
   ```bash
   mkdir -p /var/www/miva_ass/public/uploads
   chmod -R 775 /var/www/miva_ass/public/uploads
   ```

---

## 🛠️ Useful Management Commands

```bash
# View live PM2 application logs
pm2 logs miva-maintenance

# Restart the application
pm2 restart miva-maintenance

# Reload Nginx server
sudo systemctl reload nginx

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log
```
