# Retrievo – Cloud-Based Lost & Found Portal

**Course:** CSBC 252: Introduction to Cloud Computing  
**Group:** Group 5  
**Project Title:** Design, Deploy, and Demonstrate a Cloud-Based Application Using AWS Free Tier  

---

##  Live Application & Repository Links
* **GitHub Repository:** [[https://github.com/your-username/lost-found-portal](https://github.com/your-username/lost-found-portal](https://github.com/NhiiSmart/Retrievo.git))
* **Live Web Application:** `http://<YOUR-EC2-PUBLIC-IP>`

---

## 👥 Group Members & Roles
* **Frontend Developer:** UI Component Architecture, Form Validation, React Dropzone & Toast Integration
* **Backend Developer:** Node.js/Express REST APIs, Presigned S3 URL Generation, Authentication Routes
* **Cloud Architect / DevOps:** AWS EC2 Provisioning, Security Groups, S3 CORS Configuration, CloudWatch Monitoring
* **Database Administrator:** MySQL Schema Design, Relational Data Modeling, AWS RDS Deployment
* **QA / Security Specialist:** IAM Least-Privilege Policies, Input Validation, System Integration Testing

---

## 🛠️ Tech Stack & Architecture

### **Frontend & Backend**
* **Frontend:** React.js (Vite), Tailwind CSS, React Router, React Dropzone
* **Backend:** Node.js, Express.js, AWS SDK v3
* **Database:** MySQL (Relational Data Model)

### **AWS Cloud Services (3-Tier Infrastructure)**
* **Amazon EC2:** Application hosting and web server execution.
* **Amazon RDS (MySQL):** Managed database for user accounts, item listings, and claims.
* **Amazon S3 (`retrievo-item-photo`):** Secure object storage for uploaded item images via presigned URLs.
* **AWS IAM:** Least-privilege access keys and role management.
* **Amazon CloudWatch:** System performance metrics (EC2 CPU utilization and RDS database connections).

---

## Project Structure

```text
lost-found-portal/
├── backend/
│   ├── src/
│   │   ├── config/       # RDS & AWS S3 Configuration
│   │   ├── controllers/  # Route Controllers (Auth, Items, Uploads)
│   │   ├── routes/       # Express API Endpoints
│   │   └── services/     # S3 Presigned URL Services
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/   # UI Components & Item Lists
│   │   ├── hooks/        # Custom Hooks (useUpload, useItems, useAuth)
│   │   ├── pages/        # Dashboard, PostItem, Home Pages
│   │   └── services/     # API Client & Upload Service
│   └── package.json
└── README.md
