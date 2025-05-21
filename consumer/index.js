const amqp = require('amqplib');
const winston = require('winston');
const config = require('./config');

// Configure logger
const logger = winston.createLogger({
  level: config.LOGGING.LEVEL,
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

class Consumer {
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

      await this.channel.assertQueue(config.RABBITMQ.QUEUE, { durable: true });
      await this.channel.bindQueue(
        config.RABBITMQ.QUEUE,
        config.RABBITMQ.EXCHANGE,
        config.RABBITMQ.ROUTING_KEY
      );

      logger.info('Connected to RabbitMQ and queue created');
    } catch (error) {
      logger.error('Error connecting to RabbitMQ:', error);
      throw error;
    }
  }

  async consume() {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }

    try {
      await this.channel.consume(config.RABBITMQ.QUEUE, (message) => {
        if (message !== null) {
          const content = JSON.parse(message.content.toString());
          logger.info('Received message:', content);
          
          // Process the message (e.g., save to DB, trigger workflow)
          this.processMessage(content);
          
          this.channel.ack(message);
        }
      });

      logger.info('Waiting for messages...');
    } catch (error) {
      logger.error('Error consuming messages:', error);
      throw error;
    }
  }

  processMessage(message) {
    // Implement your business logic here
    logger.info(`Processing order ${message.id} for customer ${message.customerId}`);
    logger.info(`Order details: ${message.quantity}x ${message.productId} - $${message.amount}`);
  }

  async close() {
    if (this.connection) {
      await this.connection.close();
      logger.info('Connection to RabbitMQ closed');
    }
  }
}

// Start the consumer
(async () => {
  const consumer = new Consumer();
  await consumer.connect();
  await consumer.consume();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await consumer.close();
    process.exit(0);
  });
})();