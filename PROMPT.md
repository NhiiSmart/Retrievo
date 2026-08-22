I need to build a full-stack Lost & Found Portal web application using React for the frontend and Node.js/Express for the backend. Please generate the complete starter codebase with the following specifications:

## Project Overview
- Name: Lost & Found Portal
- Purpose: Allow users to report lost/found items, browse listings, and submit/approve claims
- Target users: Students and staff on a university campus

## Frontend Requirements (React + Vite)
Generate the following folder structure and files:

### src/App.jsx
- Setup React Router (v6) with routes: /, /login, /register, /dashboard, /post-item, /item/:id, /profile
- Wrap with AuthContext provider
- Add Toast notifications container

### src/context/AuthContext.jsx
- Create authentication context with:
  - user state, login(), register(), logout()
  - Persist JWT token in localStorage
  - Auto-login on page refresh if token exists
  - isAuthenticated and loading states

### src/services/api.js
- Configure Axios instance with:
  - Base URL from environment variable (VITE_API_URL)
  - Interceptor to add JWT token to Authorization header
  - Response interceptor for error handling (401 redirect to login)

### src/services/authService.js
- API calls: login(email, password), register(userData), logout(), getCurrentUser()

### src/services/itemService.js
- API calls: getItems(filters), getItem(id), createItem(data), updateItem(id, data), deleteItem(id)

### src/services/claimService.js
- API calls: getClaims(itemId), submitClaim(itemId, message), approveClaim(claimId), rejectClaim(claimId)

### src/hooks/useAuth.js
- Custom hook that returns useAuth() from AuthContext

### src/hooks/useItems.js
- Custom hook with:
  - items state, loading, error
  - fetchItems(filters), fetchItem(id), createItem, updateItem, deleteItem
  - search functionality with debounce

### src/components/common/Navbar.jsx
- Responsive navigation bar with:
  - Logo/brand
  - Links: Home, Dashboard, Post Item
  - Auth buttons: Login/Register or Logout + user avatar
  - Mobile hamburger menu

### src/components/common/ProtectedRoute.jsx
- Route wrapper that redirects to login if not authenticated

### src/pages/Login.jsx
- Login form with email/ password fields
- Form validation
- Redirect to dashboard after successful login
- Link to registration page

### src/pages/Register.jsx
- Registration form: name, email, password, confirm password
- Form validation (email format, password strength, password match)
- Redirect to login after successful registration

### src/pages/Home.jsx
- Landing page showing:
  - Search bar (filter by keyword)
  - Category filter dropdown (Electronics, Clothing, Books, Documents, Keys, Pets, Other)
  - Status filter (Lost or Found)
  - Grid of ItemCard components
  - Loading skeletons
  - Empty state if no items

### src/pages/Dashboard.jsx (Protected)
- User dashboard showing:
  - "My Items" section (items user posted)
  - "My Claims" section (claims user submitted) with status badges
  - Quick "Post Item" button
  - Stats cards

### src/pages/PostItem.jsx (Protected)
- Form to create a new lost/found item with:
  - Title, Category (dropdown), Location, Date lost/found, Description (textarea)
  - Item status: Lost or Found
  - Image upload (drag-and-drop or file picker)
  - Image preview before upload
  - Submit button with loading state

### src/pages/ItemDetail.jsx
- Full item view with:
  - Large image from S3
  - All item details (title, category, location, date, description)
  - Status badge (Lost/Found/Resolved)
  - If user is the owner: show claims list with Approve/Reject buttons
  - If user is not owner: show "Submit Claim" button with message textarea
  - If item is resolved: show "Resolved" message with claimant name

### src/components/items/ItemCard.jsx
- Card component displaying:
  - Thumbnail image
  - Title, category, location
  - Status badge
  - Date posted
  - Link to detail page

### src/utils/validators.js
- Validation functions: isValidEmail, isStrongPassword, validateItemForm, validateClaim

### src/utils/constants.js
- Constants: CATEGORIES, ITEM_STATUSES, CLAIM_STATUSES

### src/styles/index.css
- Tailwind CSS imports and custom styles
- Dark mode support (optional)

## Backend Requirements (Node.js + Express)

### server.js
- Express server setup with:
  - CORS configured for frontend origin
  - JSON body parser
  - Environment variables (PORT, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION, S3_BUCKET)
  - Routes: /api/auth, /api/items, /api/claims, /api/uploads
  - Error handling middleware

### src/db/connection.js
- MySQL connection pool using RDS credentials
- Connection test on startup

### src/models/User.js
- User model with: create, findByEmail, findById, update
- Password hashing using bcrypt

### src/models/Item.js
- Item model with: create, findAll (with filters), findById, update, delete
- Fields: title, description, category, location, date_lost_found, status (lost/found), image_url, user_id, is_resolved

### src/models/Claim.js
- Claim model with: create, findByItem, findByUser, updateStatus
- Fields: item_id, claimant_id, message, status (pending/approved/rejected)

### src/middleware/auth.js
- JWT verification middleware
- Extracts user from token and attaches to req.user

### src/routes/auth.js
- POST /register - Create new user (hash password, return JWT)
- POST /login - Authenticate user, return JWT and user info
- GET /me - Get current user (protected)

### src/routes/items.js
- GET / - Get all items (with query filters: category, status, search)
- GET /:id - Get single item with claims
- POST / - Create new item (protected, with image_url from S3)
- PUT /:id - Update item (protected, owner only)
- DELETE /:id - Delete item (protected, owner only)

### src/routes/claims.js
- POST / - Submit claim (protected)
- PUT /:id/approve - Approve claim (protected, item owner only)
- PUT /:id/reject - Reject claim (protected, item owner only)
- GET /item/:itemId - Get all claims for an item (protected)

### src/routes/uploads.js
- GET /presigned - Generate S3 pre-signed URL for image upload
  - Accepts: filename, filetype
  - Returns: url, key, bucket
  - Expires in 60 seconds

### src/utils/s3.js
- AWS S3 configuration using AWS SDK v3
- Function to generate pre-signed URL for PUT object

## Database Schema (MySQL)
```sql
-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Items table  
CREATE TABLE items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  location VARCHAR(100),
  date_lost_found DATE,
  status ENUM('lost', 'found') NOT NULL,
  image_url VARCHAR(500),
  user_id INT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Claims table
CREATE TABLE claims (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  claimant_id INT NOT NULL,
  message TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (claimant_id) REFERENCES users(id) ON DELETE CASCADE
);
