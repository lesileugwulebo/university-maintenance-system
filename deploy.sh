#!/usr/bin/env bash

# ==============================================================================
# 🚀 Automated Deployment Script: University Maintenance System (MIT 8333)
# Target OS: Ubuntu / Debian / RHEL / Linux Server
# ==============================================================================

set -e

# Color definitions
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================================================${NC}"
echo -e "${GREEN} 🏛️ MIVA Open University - Automated Docker Deployment Script${NC}"
echo -e "${CYAN}======================================================================${NC}"

# 1. Check Root / Sudo Privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}⚠️ Notice: Running with sudo helper for system installations.${NC}"
fi

# 2. Automated Docker & Docker Compose Installation Module
echo -e "\n${CYAN}[1/5] Checking Docker & Docker Compose installation...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Docker is not installed on this server. Installing Docker Engine...${NC}"
    
    # Download and run official Docker installation script
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm -f get-docker.sh

    # Enable & Start Docker systemd service
    sudo systemctl enable --now docker
    
    # Add current user to docker security group
    sudo usermod -aG docker $USER || true

    echo -e "${GREEN}✓ Docker Engine installed successfully!${NC}"
else
    echo -e "${GREEN}✓ Docker is already installed: $(docker --version)${NC}"
fi

# Verify Docker Compose Plugin
if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose plugin...${NC}"
    if command -v apt-get &> /dev/null; then
        sudo apt-get update -y && sudo apt-get install -y docker-compose-plugin
    elif command -v yum &> /dev/null; then
        sudo yum install -y docker-compose-plugin
    fi
    echo -e "${GREEN}✓ Docker Compose plugin installed!${NC}"
else
    echo -e "${GREEN}✓ Docker Compose is ready: $(docker compose version)${NC}"
fi

# 3. Prepare Environment Configuration
echo -e "\n${CYAN}[2/5] Setting up environment configuration (.env.local)...${NC}"
if [ ! -f .env.local ]; then
    cat <<EOT > .env.local
DATABASE_TYPE=mysql
MYSQL_HOST=db
MYSQL_PORT=3306
MYSQL_USER=miva_user
MYSQL_PASSWORD=MivaPassword123!
MYSQL_DATABASE=miva_maintenance
JWT_SECRET=super-secret-miva-key-12345
EOT
    echo -e "${GREEN}✓ Created default .env.local file.${NC}"
else
    echo -e "${GREEN}✓ Existing .env.local file found.${NC}"
fi

# 4. Build & Launch Docker Containers
echo -e "\n${CYAN}[3/5] Building and launching application containers...${NC}"
sudo docker compose up --build -d

# 5. Health Verification
echo -e "\n${CYAN}[4/5] Verifying application health...${NC}"
echo -n "Waiting for MySQL database and Web application to initialize..."
for i in {1..25}; do
    if sudo docker compose ps | grep -q "healthy"; then
        echo -e "\n${GREEN}✓ MySQL Database service is healthy and online!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# 6. Smart Host IP / URL Detection (Supports HOST_IP variable override)
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
PUBLIC_IP=$(curl -s --max-time 3 ifconfig.me || curl -s --max-time 3 icanhazip.com || echo "")
SERVER_IP=${HOST_IP:-${LOCAL_IP:-${PUBLIC_IP:-localhost}}}

echo -e "\n${CYAN}[5/5] Deployment Complete!${NC}"
echo -e "${CYAN}======================================================================${NC}"
echo -e "${GREEN} 🎉 Application successfully deployed and running!${NC}"
echo -e "${CYAN}======================================================================${NC}"
echo -e " 🌐 Web Portal URL  : ${YELLOW}http://${SERVER_IP}:3000${NC}"
echo -e " 🗄️ Database Engine : ${YELLOW}MySQL 8.0 (Containerized)${NC}"
echo -e "${CYAN}----------------------------------------------------------------------${NC}"
echo -e " 🔐 Default Login Accounts:${NC}"
echo -e "   • Student/Staff       : ${GREEN}student@miva.edu${NC}  /  ${GREEN}student123${NC}"
echo -e "   • Maintenance Officer : ${GREEN}officer@miva.edu${NC}  /  ${GREEN}officer123${NC}"
echo -e "   • Administrator       : ${GREEN}admin@miva.edu${NC}    /  ${GREEN}admin123${NC}"
echo -e "${CYAN}======================================================================${NC}"
echo -e " 💡 Useful Management Commands:"
echo -e "   • Custom URL run : ${YELLOW}HOST_IP=localhost ./deploy.sh${NC}"
echo -e "   • View logs      : ${YELLOW}sudo docker compose logs -f web${NC}"
echo -e "   • Stop server    : ${YELLOW}sudo docker compose down${NC}"
echo -e "   • Restart server : ${YELLOW}sudo docker compose restart${NC}"
echo -e "${CYAN}======================================================================${NC}\n"
