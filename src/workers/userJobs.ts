import { publishEvent } from "../utils/rabbitmq";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const userJobs = {
  // Job to sync user data across services
  syncUserData: async (userId: number) => {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          updatedAt: true
        }
      });

      if (user) {
        await publishEvent('user.dataSync', {
          timestamp: Date.now(),
          user
        });
        
        console.log(`✅ User data synced for user ${userId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to sync user data for user ${userId}:`, error);
      throw error;
    }
  },

  // Job to cleanup inactive users
  cleanupInactiveUsers: async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const inactiveUsers = await prisma.users.findMany({
        where: {
          isActive: false,
          updatedAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      for (const user of inactiveUsers) {
        await publishEvent('user.markedForCleanup', {
          timestamp: Date.now(),
          userId: user.id,
          email: user.email,
          inactiveSince: user.updatedAt
        });
      }

      console.log(`✅ Marked ${inactiveUsers.length} users for cleanup`);
    } catch (error) {
      console.error("❌ Failed to cleanup inactive users:", error);
      throw error;
    }
  },

  // Job to validate user emails
  validateUserEmails: async () => {
    try {
      const users = await prisma.users.findMany({
        where: {
          isActive: true,
          email: {
            not: ""
          }
        },
        take: 100 // Process in batches
      });

      for (const user of users) {
        if (user.email) { // Additional null check
          await publishEvent('user.emailValidationRequest', {
            timestamp: Date.now(),
            userId: user.id,
            email: user.email
          });
        }
      }

      console.log(`✅ Queued email validation for ${users.length} users`);
    } catch (error) {
      console.error("❌ Failed to validate user emails:", error);
      throw error;
    }
  },

  // Job to send user statistics
  generateUserStats: async () => {
    try {
      const stats = await prisma.users.groupBy({
        by: ['role', 'isActive'],
        _count: {
          id: true
        }
      });

      await publishEvent('user.statisticsGenerated', {
        timestamp: Date.now(),
        stats
      });

      console.log("✅ User statistics generated");
    } catch (error) {
      console.error("❌ Failed to generate user statistics:", error);
      throw error;
    }
  }
};