# Security & Best Practices for AWS Deployment

## 🔐 Security Checklist

### Secrets Management

- [ ] **Never commit `.env` to Git**
  ```bash
  # Verify .env is in .gitignore
  grep -i "\.env" .gitignore
  ```

- [ ] **Use AWS Secrets Manager**
  ```bash
  # Store sensitive values
  aws secretsmanager create-secret \
    --name lost-found/jwt-secret \
    --secret-string "your-secret-value"
  
  # Retrieve in Node.js
  const AWS = require('aws-sdk');
  const secrets = new AWS.SecretsManager();
  const secret = await secrets.getSecretValue({SecretId: 'lost-found/jwt-secret'}).promise();
  ```

- [ ] **Generate strong secrets**
  ```bash
  # Generate random JWT secret (min 32 chars)
  openssl rand -base64 32
  
  # Generate random database password
  openssl rand -base64 16
  ```

### Database Security

- [ ] **Use strong database passwords**
  - Minimum 16 characters
  - Mix of uppercase, lowercase, numbers, special chars
  - Never use default credentials

- [ ] **RDS Security Group restrictions**
  - Only allow traffic from backend EC2
  - Use private subnet if possible
  - Disable public accessibility for production

- [ ] **Enable RDS encryption**
  ```bash
  # At launch time:
  # - Enable "Encrypt storage"
  # - Enable "Enhanced monitoring"
  ```

- [ ] **Regular backups**
  ```bash
  # AWS Console → RDS → Automated backups
  # - Backup retention period: 30 days (minimum for production)
  # - Backup window: Off-peak hours
  ```

### Application Security

- [ ] **Update dependencies regularly**
  ```bash
  # Check for vulnerabilities
  npm audit
  
  # Fix vulnerabilities
  npm audit fix
  ```

- [ ] **Set secure HTTP headers**
  ```javascript
  // backend/server.js
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
  ```

- [ ] **CORS Configuration**
  ```javascript
  // Restrict to your frontend domain
  app.use(cors({
    origin: 'https://yourdomain.com',
    credentials: true
  }));
  ```

- [ ] **Rate limiting**
  ```bash
  npm install express-rate-limit
  ```
  ```javascript
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use('/api/', limiter);
  ```

- [ ] **Input validation**
  ```bash
  npm install joi
  ```

- [ ] **SQL injection prevention**
  - ✅ Using parameterized queries (connection.js already does this)
  - ✅ Never concatenate user input into SQL

- [ ] **Password hashing**
  - ✅ Using bcryptjs with salt rounds (auth.js already does this)

### AWS IAM & Access Control

- [ ] **Use IAM roles, not hardcoded keys**
  ```bash
  # Create EC2 instance with IAM role
  # Attach policy:
  # - S3 access (for uploads)
  # - RDS access (if needed)
  # - Secrets Manager access
  ```

- [ ] **Principle of least privilege**
  - Backend EC2 needs: S3, Secrets Manager
  - Frontend EC2 needs: CloudFront (if using CDN)
  - Don't use root AWS account

- [ ] **Enable CloudTrail for audit**
  ```bash
  # AWS Console → CloudTrail
  # Log all API calls for compliance/debugging
  ```

### Network Security

- [ ] **Use HTTPS/TLS everywhere**
  ```bash
  # Use Let's Encrypt (free)
  sudo apt-get install -y certbot
  sudo certbot certonly --nginx -d yourdomain.com
  
  # Auto-renew
  sudo systemctl enable certbot.timer
  ```

- [ ] **Security groups configuration**
  ```
  Backend EC2:
    Inbound:
      - SSH 22 (only your IP)
      - HTTP 80
      - HTTPS 443
    Outbound:
      - All (to reach RDS, S3, internet)
  
  RDS:
    Inbound:
      - MySQL 3306 (only backend EC2 security group)
    Outbound:
      - All
  ```

- [ ] **Use VPC with private subnets**
  - Frontend in public subnet (serves users)
  - Backend in private subnet (behind ALB)
  - RDS in private subnet (database only)

- [ ] **Use AWS WAF (Web Application Firewall)**
  - Protect against SQL injection
  - Protect against DDoS
  - Rate limiting at AWS level

### Monitoring & Logging

- [ ] **CloudWatch Logs**
  ```javascript
  // Capture logs
  console.log('Application event');
  console.error('Error message');
  
  // Logs appear in CloudWatch automatically
  ```

- [ ] **CloudWatch Alarms**
  - CPU > 80%
  - Disk usage > 80%
  - Database connections > threshold
  - Application errors > threshold

- [ ] **Enable query logging**
  ```sql
  -- RDS Query Insights
  -- AWS Console → RDS → Query Insights
  ```

- [ ] **Application Performance Monitoring**
  ```bash
  npm install --save aws-xray-sdk-core
  ```

### Session & Token Security

- [ ] **JWT best practices**
  ```javascript
  // Good
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256'
  });
  
  // Verify
  jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ['HS256']
  });
  ```

- [ ] **Secure token storage (frontend)**
  - Store in httpOnly cookie (not localStorage)
  - Add SameSite attribute

- [ ] **Token expiration & refresh**
  - Short-lived tokens (15 mins)
  - Refresh tokens (7 days)
  - Rotate tokens on sensitive operations

- [ ] **CSRF protection**
  ```bash
  npm install csurf
  ```

### File Upload Security

- [ ] **Validate file uploads**
  ```javascript
  // backend/src/routes/uploads.js
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error('Invalid file type');
  }
  ```

- [ ] **S3 bucket security**
  ```bash
  # Block public access
  aws s3api put-public-access-block \
    --bucket lost-found-portal-uploads \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
  
  # Versioning
  aws s3api put-bucket-versioning \
    --bucket lost-found-portal-uploads \
    --versioning-configuration Status=Enabled
  
  # Encryption
  aws s3api put-bucket-encryption \
    --bucket lost-found-portal-uploads \
    --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
  ```

- [ ] **Presigned URLs expiration**
  ```javascript
  // URLs should expire quickly (15 minutes)
  const url = s3.getSignedUrl('putObject', {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: filename,
    Expires: 15 * 60 // 15 minutes
  });
  ```

### Data Protection

- [ ] **Encryption at rest**
  - ✅ RDS encrypted
  - ✅ S3 encrypted
  - ✅ EBS volumes encrypted

- [ ] **Encryption in transit**
  - ✅ HTTPS for all API calls
  - ✅ TLS for database connections

- [ ] **Data retention policies**
  ```javascript
  // Delete old uploaded images after X days
  // Delete user data on account deletion
  // Implement GDPR compliance
  ```

### Compliance & Audit

- [ ] **PCI DSS (if handling payments)**
  - No payment data in logs
  - No PCI data in databases
  - Use payment processor (Stripe, etc.)

- [ ] **GDPR (if users are in EU)**
  - Right to be forgotten
  - Data portability
  - Privacy policy

- [ ] **HIPAA (if handling health data)**
  - Encryption requirements
  - Access logging
  - Audit trails

- [ ] **SOC2 compliance**
  - Change management
  - Access controls
  - Monitoring & logging
  - Incident response plan

### Incident Response

- [ ] **Create incident response plan**
  - Who to contact
  - How to detect breaches
  - How to respond
  - How to communicate

- [ ] **Regular security audits**
  ```bash
  # OWASP Top 10 vulnerabilities
  # Dependency vulnerability scanning
  # Code security review
  ```

- [ ] **Disaster recovery plan**
  - RDS automated backups
  - Database restore testing
  - Application recovery time
  - Data recovery procedures

---

## 🛡️ Security Best Practices

### Development

1. **Use `.env.example`** - Never commit real secrets
2. **Validate all inputs** - Frontend and backend
3. **Use HTTPS everywhere** - Even in development
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Use static analysis** - SonarQube, ESLint security plugins

### Deployment

1. **Infrastructure as Code** - Use CloudFormation/Terraform
2. **Immutable infrastructure** - Don't SSH and modify
3. **Automated testing** - Unit, integration, security tests
4. **Staging environment** - Test before production
5. **Blue-green deployments** - Zero-downtime updates

### Production

1. **Enable all logging** - CloudWatch, VPC Flow Logs
2. **Monitor continuously** - CloudWatch alarms, dashboards
3. **Regular backups** - Tested recovery procedures
4. **Regular updates** - Security patches within 24 hours
5. **Security scanning** - Regular penetration testing

### Operations

1. **Principle of least privilege** - Users, roles, access
2. **Regular audits** - Access logs, API logs
3. **Change management** - Document all changes
4. **Incident response** - Have a plan, practice it
5. **Business continuity** - Disaster recovery plan

---

## 📋 Post-Deployment Checklist

- [ ] All secrets in AWS Secrets Manager
- [ ] HTTPS enabled and certificates auto-renewing
- [ ] RDS encrypted and backed up
- [ ] S3 bucket with encryption and versioning
- [ ] IAM roles with least privilege
- [ ] Security groups properly configured
- [ ] CloudWatch monitoring enabled
- [ ] Alerts configured for critical metrics
- [ ] Application logs being captured
- [ ] Firewall rules configured
- [ ] VPC and subnet structure reviewed
- [ ] Database passwords changed from defaults
- [ ] SSL/TLS certificates valid
- [ ] No secrets in environment variables (use Secrets Manager)
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation implemented
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Security headers configured
- [ ] Dependencies up to date
- [ ] Code reviewed for security issues
- [ ] Penetration testing scheduled
- [ ] Backup restoration tested
- [ ] Incident response plan documented
- [ ] Team trained on security procedures

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [Helmet.js](https://helmetjs.github.io/) - Secure HTTP headers
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Last Updated**: 2026-08-21
