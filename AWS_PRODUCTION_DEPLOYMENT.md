# AWS Production Deployment - Complete Guide

## Quick Start Summary

This guide deploys Lost & Found Portal to AWS with:
- **Frontend**: EC2 + Nginx (React app)
- **Backend**: EC2 + Nginx (Node.js API)
- **Database**: AWS RDS (MySQL)
- **File Storage**: AWS S3 (presigned URLs)

## Architecture

```
Users (Browser)
    ↓
Nginx Reverse Proxy (Frontend EC2, port 80/443)
    ↓
React App (served as static files)
    ↓ (HTTPS)
Nginx Reverse Proxy (Backend EC2, port 80/443)
    ↓
Node.js Express Server (port 5000)
    ↓
AWS RDS MySQL (port 3306)
    ↓
AWS S3 (file uploads)
```

---

## Prerequisites

✅ AWS Account with:
- EC2 access (t2.micro free tier instances)
- RDS access (db.t3.micro free tier)
- S3 access (free tier storage)
- IAM access (to create roles)

✅ Local tools:
- AWS CLI configured (`aws configure`)
- SSH client
- Text editor
- Git

✅ SSH Key Pair created in AWS EC2

---

## Phase 1: Database Setup (AWS RDS)

### 1.1 Create RDS Instance

1. Open AWS Console → RDS → Create Database
2. Choose **MySQL 8.0**
3. Settings:
   - Instance identifier: `lost-found-db`
   - Master username: `admin`
   - Master password: `[Generate strong password - save it!]`
   - DB size: 20 GB (free tier)
   - Publicly accessible: **Yes** (for initial setup)

4. Under "Additional Configuration":
   - Initial database name: `lost_found_portal`
   - Backup retention: 7 days
   - Auto minor version upgrade: Yes

5. Click **Create Database** and wait (5-10 minutes)

6. **Note the Endpoint**: `lost-found-db.xxxxx.us-east-1.rds.amazonaws.com`

### 1.2 Initialize Database Schema

Once RDS is running, initialize the database:

```bash
# From your local machine
cd backend

# Install MySQL client if needed
# macOS: brew install mysql-client
# Ubuntu: sudo apt-get install mysql-client
# Windows: Download MySQL Workbench

# Import schema
mysql -h lost-found-db.xxxxx.us-east-1.rds.amazonaws.com \
      -u admin -p \
      lost_found_portal < src/db/seed.sql

# When prompted, enter the RDS master password
```

✅ Database is now ready with schema and seed data

---

## Phase 2: Backend Deployment (EC2 + Node.js)

### 2.1 Create Backend EC2 Instance

1. EC2 Dashboard → Launch Instance
2. Configuration:
   - Name: `lost-found-backend`
   - AMI: Ubuntu 22.04 LTS
   - Instance type: **t2.micro** (free tier)
   - Key pair: Select or create new
   - Security group: Allow SSH (22), HTTP (80), HTTPS (443)
   - Storage: 30 GB

3. Launch and wait for "running" status
4. Note the **Public IPv4 address**

### 2.2 Connect via SSH

```bash
chmod 600 your-key.pem
ssh -i your-key.pem ubuntu@<ec2-public-ip>
```

### 2.3 Run Deployment Script

On the EC2 instance:

```bash
# Download deployment script
curl -O https://raw.githubusercontent.com/yourusername/lost-found-portal/main/backend/deploy-aws-ec2.sh

# Make executable
chmod +x deploy-aws-ec2.sh

# Run it
./deploy-aws-ec2.sh
```

This script will:
- ✅ Install Node.js 24
- ✅ Install dependencies
- ✅ Configure PM2 process manager
- ✅ Set up Nginx reverse proxy
- ✅ Start the backend application

### 2.4 Configure Backend Environment

Edit the `.env` file:

```bash
sudo nano ~/lost-found-portal/backend/.env
```

Update these values:

```env
PORT=5000
NODE_ENV=production
DB_HOST=lost-found-db.xxxxx.us-east-1.rds.amazonaws.com  # Your RDS endpoint
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=your-rds-password
DB_NAME=lost_found_portal
JWT_SECRET=generate-a-random-string-min-32-chars
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
```

Save (Ctrl+O, Enter, Ctrl+X)

### 2.5 Restart Backend

```bash
pm2 restart lost-found-backend
pm2 logs lost-found-backend
```

✅ Backend should now be running and connecting to RDS

### 2.6 Test Backend

```bash
# From your local machine
curl http://<backend-ec2-ip>/health

# Should return:
# {"status":"ok","message":"Lost & Found API is running"}
```

---

## Phase 3: Frontend Deployment (EC2 + Static Files)

### 3.1 Create Frontend EC2 Instance

Repeat Phase 2.1 but name it `lost-found-frontend`

### 3.2 Connect and Deploy

```bash
ssh -i your-key.pem ubuntu@<frontend-ec2-public-ip>

# Download deployment script
curl -O https://raw.githubusercontent.com/yourusername/lost-found-portal/main/frontend/deploy-aws-ec2.sh

chmod +x deploy-aws-ec2.sh
./deploy-aws-ec2.sh
```

### 3.3 Configure Frontend Environment

Before running the script, create `.env.production`:

```bash
cat > ~/lost-found-portal/frontend/.env.production << EOF
VITE_API_URL=http://<backend-ec2-ip>/api
VITE_API_TIMEOUT=10000
EOF
```

(Or update the backend URL after deployment)

### 3.4 Verify Deployment

```bash
# From your local machine
curl http://<frontend-ec2-ip>

# Should return HTML (the React app)
```

✅ Frontend is now running and serving the React app

---

## Phase 4: Connect Frontend to Backend

### 4.1 Update Frontend API URL

On the **frontend EC2 instance**:

```bash
# Edit environment
cat > /var/www/lost-found/.env.production << EOF
VITE_API_URL=http://<backend-ec2-ip>/api
EOF

# The app is already built with the API URL baked in at build time,
# so this is for reference. To actually change it, rebuild:

cd ~/lost-found-portal/frontend
npm run build
sudo cp -r dist/* /var/www/lost-found/
```

✅ Frontend and backend are now connected

---

## Phase 5: AWS S3 Setup (File Uploads)

### 5.1 Create S3 Bucket

```bash
aws s3 mb s3://lost-found-portal-uploads --region us-east-1
```

### 5.2 Create IAM Role for EC2

1. AWS Console → IAM → Roles → Create Role
2. Trusted entity: EC2
3. Permissions: **AmazonS3FullAccess** (or custom policy)
4. Role name: `lost-found-ec2-role`
5. Create role

### 5.3 Attach Role to Backend EC2

1. EC2 Dashboard → Select backend instance
2. Instance State → Security → Modify IAM role
3. Select `lost-found-ec2-role`

### 5.4 Update Backend Configuration

```bash
ssh -i your-key.pem ubuntu@<backend-ec2-ip>
nano ~/lost-found-portal/backend/.env

# Update:
AWS_S3_BUCKET=lost-found-portal-uploads
AWS_REGION=us-east-1

# Save and restart
pm2 restart lost-found-backend
```

✅ Backend can now upload to S3 using EC2 IAM role

---

## Phase 6: Security Hardening

### 6.1 Update RDS Security Group

1. RDS Dashboard → Database → Modify
2. Security group: Add inbound rule
   - Type: MySQL/Aurora (3306)
   - Source: Security group of backend EC2
3. Remove public accessibility (for production)

### 6.2 Update EC2 Security Groups

**Backend EC2:**
- Inbound: SSH (22) from your IP, HTTP (80), HTTPS (443)
- Outbound: Allow all (for RDS, S3, internet)

**Frontend EC2:**
- Inbound: SSH (22) from your IP, HTTP (80), HTTPS (443)
- Outbound: Allow all

### 6.3 HTTPS with Let's Encrypt

On both EC2 instances:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

Update Nginx config to use HTTPS.

---

## Phase 7: Monitoring & Maintenance

### 7.1 Check Backend Status

```bash
ssh -i your-key.pem ubuntu@<backend-ec2-ip>
pm2 logs lost-found-backend
pm2 monit
```

### 7.2 Check Database Status

```bash
# AWS Console → RDS → Databases → lost-found-db
# View CPU, connections, storage
```

### 7.3 Check File Uploads

```bash
aws s3 ls s3://lost-found-portal-uploads/
```

### 7.4 Enable Auto-Renewal for SSL

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Phase 8: Domain & CDN (Optional)

### 8.1 Point Domain to Backend

1. Register domain (Route 53, Godaddy, etc.)
2. Add DNS records:
   - `api.yourdomain.com` → Backend EC2 Elastic IP
   - `yourdomain.com` → Frontend EC2 Elastic IP

### 8.2 CloudFront CDN (Optional)

1. CloudFront → Create distribution
2. Origin: Frontend S3 bucket
3. Alias: your-domain.com
4. SSL: ACM certificate

---

## Troubleshooting

### Backend won't start
```bash
pm2 logs lost-found-backend
# Check for:
# - RDS connection errors (firewall, credentials)
# - Port conflicts
# - Missing environment variables
```

### Frontend can't reach backend
```bash
# From frontend EC2:
curl http://<backend-ip>/health

# From your local:
curl http://<backend-ip>/health

# Check CORS in backend/server.js
```

### Database connection timeout
```bash
# From backend EC2:
mysql -h your-rds-endpoint.com -u admin -p -e "SELECT 1;"

# Check RDS security group allows 3306 from backend
```

---

## Cost Breakdown (AWS Free Tier - First 12 Months)

| Service | Free Tier | Monthly Cost |
|---------|-----------|--------------|
| EC2 (2x t2.micro) | 750 hours | $0 |
| RDS (db.t3.micro) | 750 hours | $0 |
| S3 (5GB) | 5 GB storage | $0 |
| Data transfer | 15 GB out | $0 |
| **Total** | **All free** | **$0** |

After free tier:
- EC2: ~$8/month each
- RDS: ~$15/month
- S3: ~$0.05 per GB stored

---

## Deployment Checklist

- [ ] RDS database created and initialized
- [ ] Backend EC2 instance running
- [ ] Backend `.env` configured with RDS details
- [ ] Backend health endpoint responding
- [ ] Frontend EC2 instance running
- [ ] Frontend built and deployed
- [ ] Frontend can reach backend API
- [ ] S3 bucket created
- [ ] IAM role attached to backend EC2
- [ ] HTTPS certificates obtained
- [ ] Security groups configured
- [ ] Monitoring enabled (CloudWatch)
- [ ] Backups enabled (RDS)
- [ ] Domain pointed to servers (if applicable)

---

## Next Steps for Production

1. **Enable HTTPS** - Use Let's Encrypt/ACM
2. **Set up monitoring** - CloudWatch alarms for CPU, disk, connections
3. **Enable backups** - Automated RDS snapshots
4. **Configure auto-scaling** - For traffic spikes
5. **Set up CI/CD** - GitHub Actions for automatic deployments
6. **Monitor costs** - AWS Cost Explorer
7. **Security audit** - Verify no secrets in code/logs
8. **Load testing** - Test with realistic user traffic
9. **Disaster recovery** - Plan for failover/recovery
10. **Update documentation** - Keep runbooks current

---

## Support & Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **Node.js Hosting**: https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
- **MySQL RDS**: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/
- **EC2 Best Practices**: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-best-practices.html

---

**Deployment Guide v1.0** | Last Updated: 2026-08-21
