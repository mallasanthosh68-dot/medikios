require('dotenv').config();

// Global Resilience Handlers to prevent backend termination
process.on('uncaughtException', (err) => {
  console.error('[Resilience Warning] Uncaught Exception caught gracefully:', err.message, err.stack);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Resilience Warning] Unhandled Promise Rejection:', reason);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, getDBStatus } = require('./src/config/db');
const { isSupabaseConfigured, testSupabaseConnection } = require('./src/config/supabase');
const { errorHandler } = require('./src/middleware/errorHandler');
const { seedDatabase } = require('./src/utils/seedData');

// Route Handlers
const authRoutes = require('./src/routes/authRoutes');
const patientRoutes = require('./src/routes/patientRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');
const medicineRoutes = require('./src/routes/medicineRoutes');
const prescriptionRoutes = require('./src/routes/prescriptionRoutes');
const integrationRoutes = require('./src/routes/integrationRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const { createDoctorRequest } = require('./src/controllers/doctorController');
const { protect } = require('./src/middleware/authMiddleware');
const { requireRole } = require('./src/middleware/rbacMiddleware');

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsing Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static Document Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// System Health & Diagnostics Endpoint
app.get('/api/health', async (req, res) => {
  const supabaseTest = await testSupabaseConnection();
  res.json({
    status: 'healthy',
    application: 'MediKiosk - Smart Hospital Assistant Backend API',
    build: 'SIH-2026-PROTOTYPE',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: getDBStatus(),
    supabase: {
      configured: isSupabaseConfigured(),
      connected: supabaseTest.connected,
      message: supabaseTest.message,
    },
  });
});

// Dedicated Supabase connection inspection route
app.get('/api/system/supabase-status', async (req, res) => {
  const status = await testSupabaseConnection();
  res.json({
    configured: isSupabaseConfigured(),
    ...status,
  });
});

// Mount Core REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.post('/api/doctor-requests', protect, requireRole('patient'), createDoctorRequest);

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to MediKiosk Smart Hospital Assistant REST API',
    version: '1.0.0 (SIH Prototype)',
    documentation: '/README.md',
    healthCheck: '/api/health',
  });
});

// Global 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Utility to cleanly free port if a previous orphaned node process is lingering
const freePortIfOccupied = (port) => {
  try {
    const { execSync } = require('child_process');
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes('LISTENING')) {
          const tokens = line.trim().split(/\s+/);
          const pid = tokens[tokens.length - 1];
          if (pid && pid !== String(process.pid) && pid !== '0') {
            console.log(`[Port Manager] Found existing process (PID ${pid}) on port ${port}. Freeing port...`);
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
              console.log(`[Port Manager] Successfully released port ${port}.`);
            } catch (e) {}
          }
        }
      }
    }
  } catch (e) {
    // Port was already free or command returned exit code 1
  }
};

const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    // Ensure port is available before binding
    freePortIfOccupied(PORT);

    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🏥 MediKiosk Backend API running on port ${PORT}`);
      console.log(`📡 Healthcheck: http://localhost:${PORT}/api/health`);
      console.log(`💊 10,000+ Medicines Formulary Ready | Multi-Tab Isolated Auth Active`);
      console.log('====================================================');
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Port Warning] Port ${PORT} is in use. Attempting auto-recovery...`);
        freePortIfOccupied(PORT);
        setTimeout(() => {
          server.close();
          server.listen(PORT);
        }, 1000);
      } else {
        console.error('Server network error:', err);
      }
    });
  } catch (error) {
    console.error('Fatal Server Initialization Error:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
