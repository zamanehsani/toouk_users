import { connectRabbitMQ, publishEvent, consumeEvents, closeRabbitMQ } from '../utils/rabbitmq.js';

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
if (import.meta.url === `file://${process.argv[1]}`) {
  testRabbitMQ();
}

export { testRabbitMQ };