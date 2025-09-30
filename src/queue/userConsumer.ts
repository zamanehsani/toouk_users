import { consumeEvents } from "../utils/rabbitmq";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const startEventConsumers = async () => {
  try {
    // Consumer for user registration events from auth service
    await consumeEvents('user.registered', async (message) => {
        console.log("message: user.registered", message);
      try {
        const { userId, email, username, role } = message;
        
        // Check if user already exists in users service
        const existingUser = await prisma.users.findFirst({
          where: { email }
        });

        if (!existingUser) {
          // Create user profile in users service
          await prisma.users.create({
            data: {
              email,
              role: role || "USER",
              isActive: true,
              // Set other fields as needed
            }
          });
          
          console.log(`✅ Created user profile for ${email}`);
        }
        
      } catch (error) {
        console.error("❌ Error processing user registration:", error);
      }
    });

    // Consumer for authentication events
    await consumeEvents('user.loggedIn', async (message) => {
        console.log("message: user.loggedIn", message);
      try {
        const { userId, email } = message;
        
        // Update last login timestamp or other login-related data
        await prisma.users.updateMany({
          where: { email },
          data: {
            updatedAt: new Date()
            // Could add lastLoginAt field to schema
          }
        });
        
        console.log(`✅ Processed login for user ${email}`);
      } catch (error) {
        console.error("❌ Error processing user login:", error);
      }
    });

    // Consumer for payment completion events
    await consumeEvents('payment.completed', async (message) => {
      try {
        const { userId, paymentId, amount, type } = message;
        
        // Find user by a matching field (this would need better user ID mapping)
        // For now, we'll just log the event
        console.log(`✅ Payment completed for user ${userId}: ${amount}`);
        
        // Could update user tier, unlock features, etc. based on payment
        if (type === 'subscription') {
          // Handle subscription payment
        }
        
      } catch (error) {
        console.error("❌ Error processing payment completion:", error);
      }
    });

    // Consumer for subscription events
    await consumeEvents('subscription.created', async (message) => {
      try {
        const { subscription } = message;
        const { userId, planId, amount } = subscription;
        
        console.log(`✅ Subscription created for user ${userId}: Plan ${planId}`);
        
        // Could update user role or features based on subscription
        
      } catch (error) {
        console.error("❌ Error processing subscription creation:", error);
      }
    });

    // Consumer for subscription cancellation
    await consumeEvents('subscription.cancelled', async (message) => {
      try {
        const { subscriptionId, userId, immediately } = message;
        
        console.log(`✅ Subscription cancelled for user ${userId}`);
        
        // Handle subscription cancellation - maybe downgrade user features
        
      } catch (error) {
        console.error("❌ Error processing subscription cancellation:", error);
      }
    });

    console.log("🎯 Users service event consumers started");
  } catch (error) {
    console.error("❌ Failed to start event consumers:", error);
    throw error;
  }
};