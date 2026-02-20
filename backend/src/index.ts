import cors from "cors";
import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import { createServer } from "http";
import { checkEnvironment } from "./check-env";
import { connectRedis } from "./config/redis";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";

// Load environment variables FIRST
dotenv.config();

// Check environment variables
if (!checkEnvironment()) {
  logger.error("Environment check failed. Exiting...");
  process.exit(1);
}

// Import routes (after env check)
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import autofillRoutes from "./routes/autofill.routes";
import bulkUploadRoutes from "./routes/bulk-upload.routes";
import calendarRoutes from "./routes/calendar.routes";
import chatRoutes from "./routes/chat.routes";
import documentRoutes from "./routes/document.routes";
import documentOrganizationRoutes from "./routes/document-organization.routes";
import notificationRoutes from "./routes/notification.routes";
import projectMatcherRoutes from "./routes/project-matcher.routes";
import questRoutes from "./routes/quest.routes";
import socialRoutes from "./routes/social.routes";
import taskRoutes from "./routes/task.routes";
import userRoutes from "./routes/user.routes";

// Initialize workers (after env check)
import "./workers/documentProcessor";
import "./workers/notificationWorker";
logger.info("✅ Background workers initialized");

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "https://personal-assistant-for-life-on-camp.vercel.app",
      ].filter(Boolean) as string[];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(rateLimiter);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "P.A.L. Backend API",
  });
});

// API Routes
app.get("/api/v1", (req: Request, res: Response) => {
  res.json({
    message: "P.A.L. API v1",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      documents: "/api/v1/documents",
      chat: "/api/v1/chat",
      social: "/api/v1/social",
      admin: "/api/v1/admin",
    },
  });
});

// Mount routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/social", socialRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/admin/documents", documentOrganizationRoutes);
app.use("/api/v1/projects", projectMatcherRoutes);
app.use("/api/v1/quests", questRoutes);
app.use("/api/v1/autofill", autofillRoutes);
app.use("/api/v1/calendar", calendarRoutes);
app.use("/api/v1/bulk-upload", bulkUploadRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Initialize Redis connection (non-blocking)
connectRedis()
  .then((connected) => {
    if (connected) {
      logger.info("✅ Redis cache enabled");
    } else {
      logger.warn("⚠️  Running without Redis cache (development mode)");
    }
  })
  .catch((err) => {
    logger.warn("⚠️  Redis connection failed - continuing without cache");
  });

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 P.A.L. Backend server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔐 Auth endpoints: http://localhost:${PORT}/api/v1/auth`);
  logger.info(`👤 User endpoints: http://localhost:${PORT}/api/v1/users`);
  logger.info(`✅ Task endpoints: http://localhost:${PORT}/api/v1/tasks`);
  logger.info(
    `📄 Document endpoints: http://localhost:${PORT}/api/v1/documents`,
  );
  logger.info(`💬 Chat endpoints: http://localhost:${PORT}/api/v1/chat`);
  logger.info(
    `🔔 Notification endpoints: http://localhost:${PORT}/api/v1/notifications`,
  );
  logger.info(`👥 Social endpoints: http://localhost:${PORT}/api/v1/social`);
  logger.info(`⚙️  Admin endpoints: http://localhost:${PORT}/api/v1/admin`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

export default app;

// Force restart to pick up env changes
