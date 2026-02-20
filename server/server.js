/**
 * RMS Server - Entry Point
 * Smart Resource Management System
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// Import database
const { testConnection, initializeDatabase } = require("./config/database");

// Import routes
const authRoutes = require("./routes/auth");
const resourceRoutes = require("./routes/resources");
const requestRoutes = require("./routes/requests");
const categoryRoutes = require("./routes/categories");
const adminRoutes = require("./routes/admin");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ===================================================
// Middleware
// ===================================================

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5500",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.originalUrl}`,
    );
    next();
  });
}

// ===================================================
// Routes
// ===================================================

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "RMS API Server is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use(errorHandler);

// ===================================================
// Server Startup
// ===================================================

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("❌ Cannot start server without database connection");
      process.exit(1);
    }

    // Initialize database (create tables)
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║         RMS Server Started Successfully        ║
╠════════════════════════════════════════════════╣
║  Environment: ${process.env.NODE_ENV || "development"}${" ".repeat(29 - (process.env.NODE_ENV || "development").length)}║
║  Port: ${PORT}${" ".repeat(34 - String(PORT).length)}║
║  API URL: http://localhost:${PORT}/api${" ".repeat(12 - String(PORT).length)}║
╚════════════════════════════════════════════════╝
            `);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
