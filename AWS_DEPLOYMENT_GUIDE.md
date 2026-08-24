# Lost & Found Portal: AWS Deployment Guide

This runbook deploys the application publicly using:

- **One Ubuntu EC2 instance** for the React frontend, Node.js API, and Nginx reverse proxy
- **AWS RDS for MySQL** for the production database
- **Amazon S3** for uploaded images
- **An IAM role** on EC2 instead of AWS access keys
- **A domain name and HTTPS** for public access

This is the simplest architecture for a lecturer to use: they only open the website URL. They do not start Node, MySQL, or PowerShell on their computer.

> AWS costs money outside applicable free tiers. Set a billing alarm before creating resources and delete resources when they are no longer required.

---

## 1. Deployment Architecture

```text
Lecturer / public users
        |
        | HTTPS 443
        v
EC2: Nginx + built React frontend
        |
        | /api/* -> localhost:5000
        v
EC2: Node.js Express backend
        |
        +--> RDS MySQL 3306
        |
        +--> S3 bucket through EC2 IAM role
```

The local MySQL command using port `3307` is only for local development. AWS RDS uses port `3306` and starts independently of your computer.

---

## 2. Before Deployment: Local Preparation

### 2.1 Confirm the application works locally

From PowerShell:

```powershell
cd "C:\Users\LEO\OneDrive\Lost-found-portal\backend"

# Start local MySQL only when doing local development.
# Start the backend and confirm it responds on port 5000.
npm start
```

In another PowerShell window:

```powershell
Invoke-WebRequest http://localhost:5000/health -UseBasicParsing
```

Then build the frontend:

```powershell
cd "C:\Users\LEO\OneDrive\Lost-found-portal\frontend"
npm run lint
npm run build
```

Resolve build or lint errors before deploying.

### 2.2 Check the repository

The repository must contain the application source, `package.json` files, and `package-lock.json` files. Confirm that local secrets are not tracked:

```powershell
cd "C:\Users\LEO\OneDrive\Lost-found-portal"
git status
git ls-files backend/.env frontend/.env
```

The last command should print nothing. Never commit:

- `backend/.env`
- `frontend/.env.production`
- Database passwords
- JWT secrets
- AWS access keys
- Private SSH keys

Use `.env.example` files for safe templates only.

### 2.3 Use the correct production database name

The current schema file creates and selects this database:

```sql
lost_found_db
```

Therefore the production backend environment must use:

```env
DB_NAME=lost_found_db
```

Do not use the local database port `3307` in AWS. RDS uses `3306`.

### 2.4 Decide the public address

Choose one of these options:

- A domain name such as `lostfound.example.com` recommended for HTTPS
- An EC2 public IP for temporary testing only

An EC2 public IP may change after stopping and starting the instance. Allocate an **Elastic IP** or use a domain with a stable address before presenting the project publicly.

---

## 3. Before Deployment: Create an AWS Account Safely

1. Sign in to the AWS console with an account that has billing access.
2. Enable multi-factor authentication on the root account.
3. Do not use the root account for daily work.
4. Create an IAM administrator or deployment user only if necessary.
5. Select one AWS Region, for example `us-east-1`, and use it for EC2, RDS, and S3.
6. Open **Billing and Cost Management** and create a monthly budget alert.
7. Never share the AWS root password, access keys, EC2 private key, RDS password, or Secrets Manager values.

---

## 4. Before Deployment: Create the RDS MySQL Database

### 4.1 Create security groups first

Open **EC2 -> Security Groups -> Create security group**.

Create these groups in the same VPC:

#### `lost-found-ec2-sg`

Inbound rules:

| Type | Port | Source | Purpose |
|---|---:|---|---|
| SSH | 22 | Your current IP `/32` | Administration only |
| HTTP | 80 | `0.0.0.0/0` | Redirect or serve HTTP |
| HTTPS | 443 | `0.0.0.0/0` | Public website |

Do not open port `5000` publicly. Nginx accesses the backend locally.

#### `lost-found-rds-sg`

Inbound rule:

| Type | Port | Source | Purpose |
|---|---:|---|---|
| MySQL/Aurora | 3306 | `lost-found-ec2-sg` | Backend-to-database traffic |

Select the EC2 security group as the source, not `0.0.0.0/0`. Never make RDS publicly accessible for this deployment.

### 4.2 Create the RDS instance

Open **RDS -> Databases -> Create database**.

Recommended settings:

- Creation method: Standard create
- Engine: MySQL 8.0
- Template: Free tier if eligible, otherwise Dev/Test
- DB instance identifier: `lost-found-db`
- Master username: `admin` or another non-root name
- Master password: generate a long unique password and store it securely
- Instance class: free-tier eligible class where available
- Storage: 20 GB to begin with
- Storage autoscaling: enable with a sensible maximum
- Availability: single-AZ for a student project; Multi-AZ for higher availability
- VPC: the same VPC as EC2
- Public access: **No**
- Existing security group: `lost-found-rds-sg`
- Database port: `3306`
- Initial database name: `lost_found_db`
- Storage encryption: enabled
- Automated backups: enabled, at least 7 days for production
- Deletion protection: enable after testing if the database must not be deleted accidentally

Create the database and wait until its status is **Available**. Copy its endpoint. It will look similar to:

```text
lost-found-db.abc123.us-east-1.rds.amazonaws.com
```

Do not copy the `https://` prefix. The endpoint is a hostname, not a URL.

### 4.3 Verify the RDS security group

After RDS is available:

1. Open the RDS instance details.
2. Confirm it uses `lost-found-rds-sg`.
3. Confirm the inbound rule source is `lost-found-ec2-sg`.
4. Confirm public access is disabled.
5. Record the endpoint, username, password, database name, and port in a secure password manager.

---

## 5. Before Deployment: Create the S3 Upload Bucket

S3 bucket names are globally unique. Choose a name such as:

```text
lost-found-portal-uploads-<your-unique-number>
```

### 5.1 Create the bucket

Open **S3 -> Create bucket**.

Use:

- The same AWS Region as EC2 and RDS
- Block all public access: enabled
- Bucket versioning: enabled
- Default encryption: enabled with SSE-S3 or SSE-KMS

The application should use presigned URLs. The bucket itself should remain private.

### 5.2 Create a least-privilege IAM policy

Open **IAM -> Policies -> Create policy** and use a policy like this. Replace the bucket name:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LostFoundUploads",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::lost-found-portal-uploads-<your-unique-number>/uploads/*"
    }
  ]
}
```

Name the policy `LostFoundUploadsPolicy`.

### 5.3 Create and attach an EC2 IAM role

1. Open **IAM -> Roles -> Create role**.
2. Trusted entity: **AWS service**.
3. Use case: **EC2**.
4. Attach `LostFoundUploadsPolicy`.
5. Name the role `LostFoundEc2Role`.
6. Launch the EC2 instance with this role, or attach it later through **EC2 -> Actions -> Security -> Modify IAM role**.

Do not set `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` on the server. The AWS SDK automatically uses the attached EC2 role.

---

## 6. During Deployment: Create the EC2 Server

### 6.1 Launch EC2

Open **EC2 -> Instances -> Launch instance**.

Recommended settings:

- Name: `lost-found-portal-server`
- AMI: Ubuntu Server 22.04 LTS 64-bit
- Instance type: free-tier eligible type where available
- Key pair: create or select one, and store the private key securely
- Network: same VPC as RDS
- Auto-assign public IP: enabled initially
- Security group: `lost-found-ec2-sg`
- IAM instance profile: `LostFoundEc2Role`
- Encrypted EBS storage: enabled

Launch the instance and wait for status checks to pass.

### 6.2 Allocate an Elastic IP

Open **EC2 -> Elastic IPs**:

1. Allocate an Elastic IP.
2. Associate it with the EC2 instance.
3. Record the address.

Release the Elastic IP when it is no longer needed because AWS may charge for unused allocated addresses.

### 6.3 Connect through SSH

From Windows PowerShell, use the key file you downloaded:

```powershell
ssh -i "C:\path\to\your-key.pem" ubuntu@YOUR_ELASTIC_IP
```

If SSH rejects the key, protect the key file and retry. Do not send the private key to anyone.

### 6.4 Install server software

Run these commands inside the EC2 SSH session:

```bash
sudo apt update
sudo apt upgrade -y

# Node.js 20 LTS is a conservative production choice for this project.
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git mysql-client
sudo npm install --global pm2

node --version
npm --version
nginx -v
```

### 6.5 Clone the project

Replace the repository URL with the actual GitHub URL:

```bash
cd ~
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY.git lost-found-portal
cd ~/lost-found-portal
```

If the repository is private, use a deploy key or another secure GitHub authentication method. Do not place a GitHub password in a command.

### 6.6 Install backend dependencies

```bash
cd ~/lost-found-portal/backend
npm ci --omit=dev
```

### 6.7 Create the production backend environment file

Create the file directly on EC2. It must not be committed:

```bash
nano ~/lost-found-portal/backend/.env
```

Use actual values:

```env
NODE_ENV=production
PORT=5000

DB_HOST=YOUR_RDS_ENDPOINT
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=YOUR_RDS_PASSWORD
DB_NAME=lost_found_db

JWT_SECRET=GENERATE_A_LONG_RANDOM_SECRET

AWS_REGION=us-east-1
AWS_S3_BUCKET=YOUR_EXACT_S3_BUCKET_NAME
```

Generate a JWT secret on the EC2 server with:

```bash
openssl rand -base64 48
```

Copy the generated value into `JWT_SECRET`. Keep this secret stable after deployment; changing it signs out existing users.

Secure the file:

```bash
chmod 600 ~/lost-found-portal/backend/.env
```

For a larger production system, store the database password and JWT secret in AWS Secrets Manager or Systems Manager Parameter Store instead of a plain server file.

### 6.8 Initialize the RDS schema

The project has a seed script that reads `backend/src/db/seed.sql`. Because the production `.env` points to RDS, run:

```bash
cd ~/lost-found-portal/backend
npm run seed
```

Expected output:

```text
Database seeded successfully
```

Run this once on a new database. Do not repeatedly run seed scripts against a production database without understanding whether they insert sample data or alter existing data.

You can also test network access from EC2 using the MySQL client:

```bash
mysql -h YOUR_RDS_ENDPOINT -P 3306 -u admin -p -e "SELECT VERSION();"
```

### 6.9 Start and verify the backend

```bash
cd ~/lost-found-portal/backend
pm2 start npm --name lost-found-backend -- start
pm2 save
pm2 startup
```

PM2 will print one additional `sudo` command. Run that command, then run:

```bash
pm2 save
curl http://127.0.0.1:5000/health
pm2 status
pm2 logs lost-found-backend --lines 50
```

Expected health response:

```json
{"status":"ok","message":"Lost & Found API is running"}
```

If the backend fails, inspect the logs before changing configuration:

```bash
pm2 logs lost-found-backend
```

### 6.10 Build the frontend for the public server

The frontend must call the public site using the same host. This avoids hardcoding localhost and avoids unnecessary cross-origin configuration.

```bash
cd ~/lost-found-portal/frontend
npm ci
```

Create the production environment file:

```bash
nano ~/lost-found-portal/frontend/.env.production
```

Use:

```env
VITE_API_URL=/api
```

Build the frontend:

```bash
npm run build
```

The `VITE_API_URL` value is embedded during the build. Changing the file afterward does not change an already-built `dist` directory; rebuild after changing it.

### 6.11 Configure Nginx

Create a site configuration:

```bash
sudo nano /etc/nginx/sites-available/lost-found-portal
```

Paste this configuration and replace `YOUR_DOMAIN` with your domain. For temporary IP-only testing, use `_` as `server_name`:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;

    root /home/ubuntu/lost-found-portal/frontend/dist;
    index index.html;

    client_max_body_size 5m;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }

    location = /health {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ /\. {
        deny all;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/lost-found-portal /etc/nginx/sites-enabled/lost-found-portal
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

Test from the EC2 server:

```bash
curl http://127.0.0.1/health
curl -I http://127.0.0.1
```

Test from your computer:

```powershell
Invoke-WebRequest "http://YOUR_ELASTIC_IP/health" -UseBasicParsing
```

At this point, the public HTTP site should be reachable by its EC2 address.

---

## 7. During Deployment: Connect a Domain and Enable HTTPS

HTTPS is required before treating the application as a real public service, especially because users submit passwords.

### 7.1 Configure DNS

At your domain provider, create an `A` record:

```text
Type: A
Name: @ or app
Value: YOUR_ELASTIC_IP
TTL: 300
```

Wait for DNS propagation, then verify from PowerShell:

```powershell
Resolve-DnsName your-domain.example
```

Update the Nginx `server_name` to the real domain and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 7.2 Install a free Let's Encrypt certificate

On EC2:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example
```

Choose the option to redirect HTTP to HTTPS. Test renewal:

```bash
sudo certbot renew --dry-run
```

The public addresses should now be:

```text
https://your-domain.example/
https://your-domain.example/health
https://your-domain.example/api/items
```

Do not use an HTTP API URL in the production frontend. With `VITE_API_URL=/api`, API calls automatically use HTTPS on the same domain.

---

## 8. Production Configuration Checklist

Before giving the URL to the lecturer, confirm all of the following:

### AWS resources

- [ ] RDS is Available
- [ ] RDS is in the same VPC as EC2
- [ ] RDS is not publicly accessible
- [ ] RDS security group allows port `3306` only from EC2 security group
- [ ] EC2 has an Elastic IP
- [ ] EC2 security group allows `80` and `443` publicly
- [ ] SSH port `22` allows only your own IP
- [ ] S3 bucket exists in the intended Region
- [ ] S3 bucket blocks public access
- [ ] S3 bucket encryption is enabled
- [ ] EC2 IAM role has only the required S3 permissions
- [ ] AWS billing alarm exists

### Backend

- [ ] Production `DB_HOST` is the RDS endpoint
- [ ] Production `DB_PORT=3306`
- [ ] Production `DB_NAME=lost_found_db`
- [ ] RDS credentials are correct
- [ ] `JWT_SECRET` is long and random
- [ ] `AWS_S3_BUCKET` contains the exact bucket name
- [ ] No AWS access keys are stored in `.env`
- [ ] `npm run seed` completed against RDS
- [ ] `pm2 status` shows the backend online
- [ ] `curl http://127.0.0.1:5000/health` returns success

### Frontend and web server

- [ ] Frontend uses `VITE_API_URL=/api`
- [ ] `npm run build` completed successfully
- [ ] Nginx configuration passes `sudo nginx -t`
- [ ] Nginx serves the React application
- [ ] Nginx proxies `/api/` to port `5000`
- [ ] SPA routes load after refreshing the page
- [ ] HTTPS certificate is active
- [ ] HTTP redirects to HTTPS

### Security

- [ ] Local and production `.env` files are ignored by Git
- [ ] No passwords or JWT secrets appear in Git history
- [ ] RDS is not open to the internet
- [ ] S3 is not public
- [ ] HTTPS is used for the public site
- [ ] The default AWS account is not used for daily administration
- [ ] RDS automated backups are enabled
- [ ] Dependencies have been checked with `npm audit`
- [ ] Test accounts and sample records are reviewed or removed

---

## 9. After Deployment: Functional Testing

Run these tests from your own computer using the HTTPS domain.

### 9.1 Health check

```powershell
Invoke-WebRequest "https://your-domain.example/health" -UseBasicParsing
```

Expected status: `200`.

### 9.2 Frontend check

Open:

```text
https://your-domain.example/
```

Confirm:

- The page loads without a blank screen.
- Browser developer tools show no failed JavaScript bundles.
- The browser does not request `localhost:5000`.

### 9.3 Registration and login

Register a test user through the website, log in, and confirm that the user session survives a page refresh. Do not use a real password during testing.

### 9.4 Items and claims

Test:

- Listing items
- Creating an item while logged in
- Editing and deleting an owned item
- Submitting a claim from another account
- Approving or rejecting a claim as the item owner

### 9.5 S3 uploads

Test an allowed image upload. Confirm:

- The request reaches `/api/uploads/presigned`.
- The request does not return `503 File uploads are not configured`.
- The image is visible using the application’s intended flow.
- The object appears under the `uploads/` prefix in S3.

Do not make the S3 bucket public just to make a browser test pass. Fix the IAM policy or object URL handling instead.

### 9.6 Database verification

From EC2:

```bash
mysql -h YOUR_RDS_ENDPOINT -P 3306 -u admin -p lost_found_db \
  -e "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10;"
```

Never display or return `password_hash` through an API or public page.

---

## 10. After Deployment: Monitoring and Operations

### 10.1 Backend process

```bash
pm2 status
pm2 logs lost-found-backend
pm2 monit
```

Restart after a configuration or code change:

```bash
cd ~/lost-found-portal/backend
pm2 restart lost-found-backend
```

### 10.2 Nginx logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 10.3 AWS monitoring

Use CloudWatch and the RDS console to watch:

- EC2 CPU and status checks
- RDS CPU, storage, and database connections
- RDS free storage space
- S3 storage and request volume
- Application and Nginx errors

Set alarms for high CPU, low disk space, and unexpected database connection growth.

### 10.4 Backups

- Confirm RDS automated backups are enabled.
- Take a manual RDS snapshot before significant schema changes.
- Enable S3 versioning.
- Periodically test restoring a database snapshot in a separate test database.
- Document how to restore the EC2 application from Git.

---

## 11. After Deployment: Updating the Application

### 11.1 Backend update

```bash
ssh -i "your-key.pem" ubuntu@YOUR_ELASTIC_IP
cd ~/lost-found-portal
git pull origin main
cd backend
npm ci --omit=dev
pm2 restart lost-found-backend
pm2 status
curl http://127.0.0.1:5000/health
```

### 11.2 Frontend update

```bash
cd ~/lost-found-portal/frontend
npm ci
npm run build
sudo nginx -t
sudo systemctl reload nginx
```

The production frontend environment file must remain at `frontend/.env.production` on the server with:

```env
VITE_API_URL=/api
```

### 11.3 Rollback

Before updating, record the deployed commit:

```bash
git rev-parse HEAD
```

To roll back:

```bash
git log --oneline -5
git checkout KNOWN_GOOD_COMMIT
cd backend
npm ci --omit=dev
pm2 restart lost-found-backend
cd ../frontend
npm ci
npm run build
sudo systemctl reload nginx
```

Use a deployment branch or release tags for more controlled production rollbacks.

---

## 12. Troubleshooting

### Backend says `ECONNREFUSED 127.0.0.1:3307`

The backend is using the local development configuration. On EC2, check:

```bash
cat ~/lost-found-portal/backend/.env
```

Use the RDS endpoint and `DB_PORT=3306`, then restart PM2.

### Backend says `Access denied for user 'root'`

The server is reading stale or incorrect database variables. Check that the EC2 `.env` contains the RDS username and password. Restart the backend after editing.

### RDS connection times out

Check that:

- EC2 and RDS are in the same VPC.
- RDS is Available.
- RDS security group allows `3306` from `lost-found-ec2-sg`.
- The hostname is the RDS endpoint without `https://`.
- The password and database name are correct.

### S3 upload returns `File uploads are not configured`

Set the exact bucket name:

```env
AWS_S3_BUCKET=lost-found-portal-uploads-your-unique-number
```

Restart PM2. Confirm the EC2 IAM role has `s3:PutObject` permission for the bucket’s `uploads/*` path.

### S3 upload returns an AWS access error

Do not add access keys immediately. First confirm:

```bash
aws sts get-caller-identity
```

The result should show the EC2 IAM role. Then check the role policy and bucket Region.

### Browser calls `localhost:5000`

The frontend was built with the development environment. Recreate `frontend/.env.production` with:

```env
VITE_API_URL=/api
```

Run `npm run build` again and reload Nginx.

### Nginx returns 502 Bad Gateway

The backend is not responding on port `5000`:

```bash
pm2 status
pm2 logs lost-found-backend --lines 100
curl http://127.0.0.1:5000/health
```

### React route returns 404 after refresh

Ensure the Nginx `location /` block contains:

```nginx
try_files $uri $uri/ /index.html;
```

Then run:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 13. Final Handover to the Lecturer

Give the lecturer only:

```text
https://your-domain.example/
```

They should not need:

- PowerShell
- Node.js
- MySQL
- AWS credentials
- The EC2 key
- The RDS password
- The `.env` file

Keep the following private as the administrator:

- AWS account and IAM credentials
- EC2 SSH key
- RDS credentials
- JWT secret
- S3 bucket permissions
- Database backups

The lecturer only needs a browser and internet access.

---

## 14. Resource Shutdown and Cleanup

When the project is no longer needed:

1. Take final RDS and S3 backups if required.
2. Stop or terminate the EC2 instance.
3. Delete the RDS instance only after confirming backups.
4. Delete S3 objects before deleting the bucket.
5. Release the Elastic IP.
6. Remove unused security groups, IAM policies, and roles.
7. Disable or delete unused CloudWatch alarms.
8. Check AWS Billing for continuing charges.

Do not delete production resources until the data retention requirement is understood.

---

## Minimum Public Deployment Result

A successful deployment ends with:

```text
https://your-domain.example/              -> React frontend
https://your-domain.example/health        -> 200 OK
https://your-domain.example/api/items     -> API response
RDS                                       -> private MySQL database
S3                                        -> private upload storage
EC2                                      -> backend and frontend always running
```
