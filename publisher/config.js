module.exports = {
  RABBITMQ: {
    URL: process.env.RABBITMQ_URL,
    EXCHANGE: process.env.EXCHANGE_NAME,
    EXCHANGE_TYPE: 'topic',
    QUEUE: process.env.QUEUE_NAME,
    ROUTING_KEY: process.env.ROUTING_KEY
  },
  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'info'
  }
};