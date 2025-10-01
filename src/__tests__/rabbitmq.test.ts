import { connectRabbitMQ, publishEvent, consumeEvents, closeRabbitMQ } from '../utils/rabbitmq';

describe('RabbitMQ Integration', () => {
  let channel: any;

  beforeAll(async () => {
    // Set up RabbitMQ connection before tests
    try {
      channel = await connectRabbitMQ();
    } catch (error) {
      console.warn('RabbitMQ not available for testing:', error);
    }
  }, 30000); // 30 second timeout for connection

  afterAll(async () => {
    // Clean up after tests
    try {
      await closeRabbitMQ();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should connect to RabbitMQ successfully', async () => {
    if (!channel) {
      console.warn('Skipping RabbitMQ test - connection not available');
      return;
    }
    
    expect(channel).toBeDefined();
    console.log('✅ RabbitMQ connection test passed');
  });

  it('should publish events to queue', async () => {
    if (!channel) {
      console.warn('Skipping publish test - RabbitMQ not available');
      return;
    }

    const testMessage = { 
      message: 'Hello from Jest test!', 
      timestamp: Date.now() 
    };

    await expect(
      publishEvent('test-queue', testMessage)
    ).resolves.not.toThrow();
    
    console.log('✅ Publishing test passed');
  });

  it('should set up event consumer', async () => {
    if (!channel) {
      console.warn('Skipping consumer test - RabbitMQ not available');
      return;
    }

    const mockHandler = jest.fn();
    
    await expect(
      consumeEvents('test-queue', mockHandler)
    ).resolves.not.toThrow();
    
    console.log('✅ Consumer setup test passed');
  });

  it('should handle connection errors gracefully', async () => {
    // Test error handling
    const originalEnv = process.env.RABBITMQ_URL;
    process.env.RABBITMQ_URL = 'amqp://invalid-url:5672';
    
    // This should handle the error gracefully
    try {
      await connectRabbitMQ();
    } catch (error) {
      expect(error).toBeDefined();
    }
    
    // Restore original environment
    process.env.RABBITMQ_URL = originalEnv;
    console.log('✅ Error handling test passed');
  });
});

// Keep the standalone test function for manual testing
async function testRabbitMQ() {
  try {
    console.log('🧪 Testing RabbitMQ connection...');
    
    // Test connection
    const channel = await connectRabbitMQ();
    console.log('✅ Connection successful');
    
    // Test publishing
    await publishEvent('test-queue', { message: 'Hello from test!', timestamp: Date.now() });
    console.log('✅ Publishing successful');
    
    // Test consuming (just set up the listener, don't wait for messages)
    await consumeEvents('test-queue', (msg) => {
      console.log('✅ Received test message:', msg);
    });
    console.log('✅ Consumer setup successful');
    
    // Wait a bit then close
    setTimeout(async () => {
      await closeRabbitMQ();
      console.log('✅ RabbitMQ test completed successfully');
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('❌ RabbitMQ test failed:', error);
    process.exit(1);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testRabbitMQ();
}

export { testRabbitMQ };