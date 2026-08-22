require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./src/db/connection');
const authRoutes = require('./src/routes/auth');
const itemRoutes = require('./src/routes/items');
const claimRoutes = require('./src/routes/claims');
const uploadRoutes = require('./src/routes/uploads');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Lost & Found API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/uploads', uploadRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    console.log(`[${new Date().toISOString()}] Starting server...`);
    console.log(`[${new Date().toISOString()}] NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[${new Date().toISOString()}] Connecting to database...`);
    
    await testConnection();
    console.log(`[${new Date().toISOString()}] Database connected successfully`);
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`);
      console.log(`[${new Date().toISOString()}] Health check: http://localhost:${PORT}/health`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log(`[${new Date().toISOString()}] SIGTERM received, shutting down gracefully...`);
      server.close(() => {
        console.log(`[${new Date().toISOString()}] Server closed`);
        process.exit(0);
      });
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to start server:`, error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
