# ☁️ AWS EC2 Linux Server Deployment Guide
## University Maintenance Service Request System (MIT 8333)

This guide provides step-by-step instructions to host and run the application on an **AWS EC2 Ubuntu 24.04/22.04 LTS** instance.

---

## 🏗️ Phase 1: AWS EC2 Instance Setup (AWS Management Console)

### 1.1 Launch Instance
1. Log in to the [AWS Management Console](https://aws.amazon.com/console/) and navigate to **EC2**.
2. Click **Launch Instance**.
3. **Name**: `MIVA-Maintenance-Server`.
4. **Application and OS Images (AMI)**: Select **Ubuntu Server 24.04 LTS** (Free tier eligible).
5. **Instance Type**: Select **`t2.micro`** or **`t3.micro`** (1 vCPU, 1 GiB RAM - Free tier eligible).
6. **Key Pair (login)**: Click **Create new key pair**:
   - Key pair name: `miva-key`
   - Key pair type: `RSA`
   - Private key file format: `.pem` (for SSH)
   - Click **Create key pair** (this downloads `miva-key.pem` to your computer).

### 1.2 Configure Network Security Group
Under **Network settings**, check the following firewall rules:
- ✅ **Allow SSH traffic from**: `My IP` (Port 22)
- ✅ **Allow HTTP traffic from the internet**: Anywhere `0.0.0.0/0` (Port 80)
- ✅ **Allow HTTPS traffic from the internet**: Anywhere `0.0.0.0/0` (Port 443)

Click **Launch Instance**.

---

## 🔑 Phase 2: Connect to EC2 via SSH

Open your computer's terminal (or PowerShell) where `miva-key.pem` was saved:

```bash
# Set file permissions on SSH key (Linux/macOS)
chmod 400 miva-key.pem

# SSH into EC2 instance (Replace IP with your EC2 Public IP)
ssh -i "miva-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## 📦 Phase 3: Install Runtimes & Database Server

### 3.1 Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ufw
```

### 3.2 Install Node.js v22 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```
Verify installation:
```bash
node -v   # Must be >= v22.5.0
npm -v
```

### 3.3 Option A: Install Local MySQL Server on EC2
If running MySQL directly on the same EC2 instance:
```bash
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```
Configure MySQL database & user:
```bash
sudo mysql
```
Inside the MySQL prompt, execute:
```sql
CREATE DATABASE miva_maintenance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'miva_user'@'localhost' IDENTIFIED BY 'MivaPassword123!';
GRANT ALL PRIVILEGES ON miva_maintenance.* TO 'miva_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 🚀 Phase 4: Deploy Application Codebase

### 4.1 Clone Repository from GitHub
```bash
cd /var/www
sudo git clone https://github.com/lesileugwulebo/university-maintenance-system.git miva_ass
sudo chown -R $USER:$USER /var/www/miva_ass
cd /var/www/miva_ass
```

### 4.2 Configure Environment Variables
Create `.env.local`:
```bash
nano .env.local
```
Paste your production settings:
```env
DATABASE_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=miva_user
MYSQL_PASSWORD=MivaPassword123!
MYSQL_DATABASE=miva_maintenance
JWT_SECRET=super-secret-miva-key-12345
```
*(Press `Ctrl+O`, `Enter` to save, and `Ctrl+X` to exit).*

### 4.3 Install Dependencies & Build Application
```bash
npm install --omit=dev
npm run build
```

---

## ⚙️ Phase 5: PM2 Process Manager & Auto-Restart

Install PM2 globally to run the server continuously:
```bash
sudo npm install -g pm2
```
Start the application:
```bash
pm2 start npm --name "miva-maintenance" -- run start
```
Configure PM2 to restart on EC2 reboot:
```bash
pm2 startup
```
Copy and run the command printed by PM2 in your terminal, then save:
```bash
pm2 save
```

---

## 🌐 Phase 6: Configure Nginx & Domain SSL

### 6.1 Install & Configure Nginx
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/miva_maintenance
```
Paste the reverse proxy configuration:
```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP yourdomain.com;

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
    }
}
```
Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/miva_maintenance /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 6.2 Setup Free SSL/HTTPS via Certbot (If you have a domain name)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## ✅ Phase 7: Verification

Visit `http://YOUR_EC2_PUBLIC_IP` or `https://yourdomain.com` in your browser.

- **Student Account**: `student@miva.edu` / `student123`
- **Maintenance Officer**: `officer@miva.edu` / `officer123`
- **Administrator**: `admin@miva.edu` / `admin123`
