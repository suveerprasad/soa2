const amqp = require('amqplib');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

// Configure logger
const logger = winston.createLogger({
  level: config.LOGGING.LEVEL,
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

class Publisher {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(config.RABBITMQ.URL);
      this.channel = await this.connection.createChannel();
      
      await this.channel.assertExchange(
        config.RABBITMQ.EXCHANGE,
        config.RABBITMQ.EXCHANGE_TYPE,
        { durable: true }
      );

      logger.info('Connected to RabbitMQ and exchange created');
    } catch (error) {
      logger.error('Error connecting to RabbitMQ:', error);
      throw error;
    }
  }

  async publish(message) {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }

    try {
      const msg = JSON.stringify({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        ...message
      });

      this.channel.publish(
        config.RABBITMQ.EXCHANGE,
        config.RABBITMQ.ROUTING_KEY,
        Buffer.from(msg),
        { persistent: true }
      );

      logger.info(`Message published: ${msg}`);
    } catch (error) {
      logger.error('Error publishing message:', error);
      throw error;
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.close();
      logger.info('Connection to RabbitMQ closed');
    }
  }
}

// Example usage
(async () => {
  const publisher = new Publisher();
  await publisher.connect();

  // Simulate publishing orders
  setInterval(async () => {
    const order = {
      customerId: `cust-${Math.floor(Math.random() * 1000)}`,
      productId: `prod-${Math.floor(Math.random() * 100)}`,
      quantity: Math.floor(Math.random() * 10) + 1,
      amount: (Math.random() * 1000).toFixed(2)
    };
    
    await publisher.publish(order);
  }, 3000);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await publisher.close();
    process.exit(0);
  });
})();