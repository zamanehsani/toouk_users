import express from "express";
import { PrismaClient } from "@prisma/client";
import { connectRabbitMQ } from "../utils/rabbitmq";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /health - Basic health check
 */
router.get("/", async (req: express.Request, res: express.Response) => {
  try {
    const healthCheck = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "users-service",
      version: process.env.SERVICE_VERSION || "1.0.0",
      uptime: process.uptime()
    };

    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      service: "users-service",
      error: "Health check failed"
    });
  }
});

/**
 * GET /health/detailed - Detailed health check
 */
router.get("/detailed", async (req: express.Request, res: express.Response) => {
  const checks = {
    timestamp: new Date().toISOString(),
    service: "users-service",
    version: process.env.SERVICE_VERSION || "1.0.0",
    uptime: process.uptime(),
    status: "healthy",
    checks: {
      database: { status: "unknown" },
      rabbitmq: { status: "unknown" },
      users: { status: "unknown" }
    }
  };

  try {
    // Database check
    try {
      await prisma.users.count();
      checks.checks.database = { status: "healthy" };
    } catch (dbError) {
      checks.checks.database = { status: "unhealthy" };
      checks.status = "unhealthy";
    }

    // RabbitMQ check
    try {
      await connectRabbitMQ();
      checks.checks.rabbitmq = { status: "healthy" };
    } catch (mqError) {
      checks.checks.rabbitmq = { status: "unhealthy" };
      checks.status = "unhealthy";
    }

    // Users system check
    try {
      const activeUsers = await prisma.users.count({
        where: { isActive: true }
      });
      checks.checks.users = { status: "healthy" };
    } catch (usersError) {
      checks.checks.users = { status: "unhealthy" };
      checks.status = "unhealthy";
    }

    const statusCode = checks.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(checks);
  } catch (error) {
    checks.status = "unhealthy";
    res.status(503).json(checks);
  }
});

/**
 * GET /health/ready - Readiness probe
 */
router.get("/ready", async (req: express.Request, res: express.Response) => {
  try {
    await prisma.users.count();
    await connectRabbitMQ();
    
    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      timestamp: new Date().toISOString(),
      error: "Service dependencies not available"
    });
  }
});

/**
 * GET /health/live - Liveness probe
 */
router.get("/live", (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString()
  });
});

export default router;