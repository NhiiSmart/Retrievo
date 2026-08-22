# Lost & Found Portal Backend

## Overview
This backend provides authentication, item management, claim handling, and presigned upload support for the Lost & Found Portal.

## Tech Stack
- Node.js
- Express
- MySQL
- JWT authentication
- AWS S3 presigned uploads

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a MySQL database and update the `.env` file.
3. Run the database seed script:
   ```bash
   node src/db/seed.js
   ```
4. Start the server:
   ```bash
   node server.js
   ```

## API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/items`
- `GET /api/items/:id`
- `POST /api/items`
- `PUT /api/items/:id`
- `DELETE /api/items/:id`
- `POST /api/claims`
- `GET /api/claims/item/:itemId`
- `PUT /api/claims/:id/approve`
- `PUT /api/claims/:id/reject`
- `GET /api/uploads/presigned`
