# AWS Deployment Guide - Lost & Found Portal

This guide covers deploying the Lost & Found Portal backend to AWS using EC2 + RDS.

## Architecture Overview

```
Frontend (EC2 - port 5173)
    ↓
Backend (EC2 - port 5000)
    ↓
Database (AWS RDS MySQL 8.0)
    ↓
File Storage (AWS S3)
```

## Prerequisites

- AWS Account with EC2 and RDS access
- AWS CLI configured locally
- Git installed
- Docker (optional, for local testing)

---

## Step 1: Create AWS RDS Database

### Create RDS MySQL Instance

1. **AWS Console** → RDS → Create Database
2. **Configuration:**
   - Engine: MySQL 8.0
   - DB Instance Class: `db.t3.micro` (free tier eligible)
   - Storage: 20 GB
   - DB Instance Identifier: `lost-found-portal-db`
   - Master Username: `admin`
   - Master Password: Generate a strong password (save it!)
   
3. **Connectivity:**
   - VPC: Default VPC
   - Public Accessibility: Yes (for now, restrict later)
   - Security Group: Allow inbound on port 3306 from your EC2 instance

4. **Database Options:**
   - Initial Database Name: `lost_found_portal`
   - Backup Retention: 7 days

5. **After creation**, note the **Endpoint** (e.g., `lost-found-portal-db.xxxxx.us-east-1.rds.amazonaws.com`)

### Initialize Database Schema

Once RDS is running:

```bash
# From your local machine
mysql -h lost-found-portal-db.xxxxx.us-east-1.rds.amazonaws.com \
      -u admin -p \
      lost_found_portal < backend/src/db/seed.sql
```

---

## Step 2: Create EC2 Instance (Backend)

### Launch EC2 Instance

1. **EC2 Dashboard** → Launch Instance
2. **Configuration:**
   - Name: `lost-found-backend`
   - AMI: Ubuntu 22.04 LTS (free tier eligible)
   - Instance Type: `t2.micro` (free tier eligible)
   - Key Pair: Create new or use existing (save `.pem` file securely)
   - Security Group: Allow:
     - SSH (22) from your IP
     - HTTP (80) for Nginx reverse proxy
     - HTTPS (443) for Nginx reverse proxy
   - Storage: 30 GB

3. **Launch and wait for running state**

### Install Dependencies on EC2

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

Run setup script:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker (optional, for containerized deployment)
sudo apt-get install -y docker.io
sudo usermod -aG docker $USER

# Install Nginx (reverse proxy)
sudo apt-get install -y nginx

# Install Git
sudo apt-get install -y git

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Deploy Backend Code

```bash
# Clone repository
git clone <your-repo-url> lost-found-portal
cd lost-found-portal/backend

# Install dependencies
npm ci --omit=dev

# Create .env file with production values
cat > .env << EOF
PORT=5000
DB_HOST=lost-found-portal-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=your-secure-password
DB_NAME=lost_found_portal
JWT_SECRET=$(openssl rand -base64 32)
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
NODE_ENV=production
EOF

# Start with PM2
pm2 start npm --name "lost-found-backend" -- start
pm2 startup
pm2 save
```

### Configure Nginx Reverse Proxy

```bash
# Create Nginx config
sudo tee /etc/nginx/sites-available/lost-found << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/lost-found /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 3: Create EC2 Instance (Frontend)

### Launch Another EC2 Instance

Repeat Step 2 but name it `lost-found-frontend`

### Deploy Frontend

```bash
ssh -i your-key.pem ubuntu@frontend-ec2-ip

# Setup Node.js (same as backend)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and build
git clone <your-repo-url> lost-found-portal
cd lost-found-portal/frontend

# Create .env for production
cat > .env.production << EOF
VITE_API_URL=http://your-backend-domain.com
VITE_API_TIMEOUT=10000
EOF

# Build
npm ci
npm run build

# Serve with Nginx
sudo cp -r dist /var/www/html/lost-found
# Configure Nginx (similar to backend)
```

---

## Step 4: Environment Variables & Secrets

### Use AWS Secrets Manager for Production

```bash
# Store JWT_SECRET in AWS Secrets Manager
aws secretsmanager create-secret \
  --name lost-found/jwt-secret \
  --secret-string "your-secret-value"

# Retrieve in your Node app
const AWS = require('aws-sdk');
const client = new AWS.SecretsManager({ region: 'us-east-1' });

async function getSecret(secretName) {
  const data = await client.getSecretValue({ SecretId: secretName }).promise();
  return JSON.parse(data.SecretString);
}
```

### Database Connection Pooling

Update `connection.js` for production:

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,        // Increased for production
  queueLimit: 50,             // Queue if at limit
  multipleStatements: true,
  enableKeepAlive: true,      // Maintain connection health
  keepAliveInitialDelayMs: 0,
});
```

---

## Step 5: AWS S3 Setup (File Uploads)

### Create S3 Bucket

```bash
aws s3 mb s3://lost-found-portal-uploads --region us-east-1
```

### Create IAM Role for EC2

1. **IAM Dashboard** → Roles → Create Role
2. **Trusted Entity**: EC2
3. **Permissions**: Attach `AmazonS3FullAccess` (or custom policy for specific bucket)
4. **Attach to your backend EC2 instance**

### Update Code (No hardcoded credentials needed)

The `uploads.js` route will automatically use EC2's IAM role credentials.

---

## Step 6: HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot certonly --nginx -d your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

---

## Step 7: Monitoring & Logging

### Monitor Backend Process

```bash
# SSH to backend instance
pm2 logs lost-found-backend

# Monitor stats
pm2 monit
```

### CloudWatch Logs

```javascript
// Add to server.js for production logging
if (process.env.NODE_ENV === 'production') {
  const AWS = require('aws-sdk');
  const cloudwatch = new AWS.CloudWatch();
  
  // Log custom metrics as needed
}
```

### Database Monitoring

Use AWS RDS Dashboard for:
- CPU utilization
- Database connections
- Disk space usage
- Query performance

---

## Step 8: Continuous Deployment (Optional)

### Using GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_KEY }}
          script: |
            cd lost-found-portal
            git pull
            cd backend
            npm ci
            pm2 restart lost-found-backend
```

---

## Security Checklist

- [ ] `.env` file NOT committed to Git
- [ ] AWS credentials use IAM roles (not hardcoded)
- [ ] RDS security group restricts access to EC2 only
- [ ] JWT_SECRET is long and random (>32 chars)
- [ ] HTTPS enabled with valid certificate
- [ ] CORS configured to allow only frontend domain
- [ ] Database backups enabled (RDS automatic)
- [ ] EC2 security groups follow principle of least privilege
- [ ] Regular security updates installed
- [ ] Logs monitored for errors

---

## Testing

```bash
# Test backend health from frontend EC2
curl http://your-backend-domain.com/health

# Test database connection from backend EC2
mysql -h your-rds-endpoint.com -u admin -p -e "SELECT 1;"

# Load test (optional)
npm install -g artillery
artillery quick --count 100 --num 10 http://your-backend-domain.com/health
```

---

## Troubleshooting

### Backend won't start
```bash
pm2 logs lost-found-backend
# Check for DB connection errors
```

### Frontend can't reach backend
- Check CORS in `server.js`
- Check Nginx reverse proxy configuration
- Check security groups allow traffic

### Database connection timeout
- Verify RDS security group allows port 3306 from EC2
- Check RDS endpoint is reachable: `telnet rds-endpoint.com 3306`

### S3 uploads failing
- Verify IAM role attached to EC2
- Check bucket policy allows EC2 role
- Verify AWS_S3_BUCKET environment variable is set

---

## Cost Estimation (AWS Free Tier)

- **EC2**: 750 hours/month (2 instances) - FREE
- **RDS**: 750 hours/month - FREE
- **S3**: 5 GB storage - FREE
- **Data transfer**: 15 GB/month out - FREE
- **Estimated cost**: ~$0 for first 12 months (with free tier)

---

## Next Steps

1. Replace placeholder values (domain, secrets, etc.)
2. Test all endpoints before production
3. Set up monitoring and alerts
4. Configure automated backups
5. Plan for scaling (auto-scaling groups, load balancing)

For questions or issues, check AWS documentation or contact AWS support.
