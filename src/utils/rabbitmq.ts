import amqp, { Connection, Channel } from "amqplib/callback_api";
import config from '../config.js';

let channel: Channel | null = null;
let connection: Connection | null = null;

export async function connectRabbitMQ(): Promise<Channel> {
  if (channel) return channel;

  try {
    // Use config for RabbitMQ URL
    const rabbitmqUrl = config.rabbitmqUrl;
    
    console.log(`🔗 Connecting to RabbitMQ at: ${rabbitmqUrl.replace(/\/\/.*@/, '//***:***@')}`);
    
    // Connect using callback API with promisify
    connection = await new Promise<Connection>((resolve, reject) => {
      amqp.connect(rabbitmqUrl, (error0, connection) => {
        if (error0) {
          reject(error0);
          return;
        }
        resolve(connection);
      });
    });
    
    // Create channel
    channel = await new Promise<Channel>((resolve, reject) => {
      connection!.createChannel((error1, channel) => {
        if (error1) {
          reject(error1);
          return;
        }
        resolve(channel);
      });
    });
    
    console.log("✅ Connected to RabbitMQ");
    
    // Handle connection events
    connection.on('close', (err) => {
      console.warn('⚠️ RabbitMQ connection closed', err ? err.message : '');
      channel = null;
      connection = null;
    });
    
    connection.on('error', (err) => {
      console.error('❌ RabbitMQ connection error:', err.message);
      channel = null;
      connection = null;
    });
    
    return channel;
  } catch (error) {
    console.error('❌ Failed to connect to RabbitMQ:', error);
    channel = null;
    connection = null;
    throw error;
  }
}

export async function publishEvent(queue: string, message: any) {
  try {
    const ch = await connectRabbitMQ();
    await new Promise<void>((resolve, reject) => {
      ch.assertQueue(queue, { durable: true }, (error0, ok) => {
        if (error0) {
          reject(error0);
          return;
        }
        
        const sent = ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
          persistent: true,
        });
        
        if (sent) {
          console.log(`📤 Published to [${queue}]:`, message);
          resolve();
        } else {
          reject(new Error('Failed to send message to queue'));
        }
      });
    });
  } catch (error) {
    console.error(`❌ Failed to publish to [${queue}]:`, error);
    throw error;
  }
}

export async function consumeEvents(queue: string, handler: (msg: any) => void) {
  try {
    const ch = await connectRabbitMQ();
    
    await new Promise<void>((resolve, reject) => {
      ch.assertQueue(queue, { durable: true }, (error0, ok) => {
        if (error0) {
          reject(error0);
          return;
        }

        ch.consume(queue, (msg) => {
          if (msg) {
            try {
              const content = JSON.parse(msg.content.toString());
              console.log(`📥 Received from [${queue}]:`, content);
              handler(content);
              ch.ack(msg);
            } catch (parseError) {
              console.error(`❌ Failed to parse message from [${queue}]:`, parseError);
              ch.nack(msg, false, false); // Reject and don't requeue
            }
          }
        }, { noAck: false }, (error1, ok) => {
          if (error1) {
            reject(error1);
            return;
          }
          console.log(`👂 Listening on [${queue}]`);
          resolve();
        });
      });
    });
  } catch (error) {
    console.error(`❌ Failed to consume from [${queue}]:`, error);
    throw error;
  }
}

// Add graceful shutdown function
export async function closeRabbitMQ(): Promise<void> {
  try {
    if (channel) {
      await new Promise<void>((resolve, reject) => {
        channel!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      channel = null;
    }
    
    if (connection) {
      await new Promise<void>((resolve, reject) => {
        connection!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      connection = null;
    }
    
    console.log("✅ RabbitMQ connection closed gracefully");
  } catch (error) {
    console.error("❌ Error closing RabbitMQ connection:", error);
    throw error;
  }
}
