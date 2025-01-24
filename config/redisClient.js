const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  url: `${process.env.REDIS_URL}`, 
});

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('Connected to Redis');
    }
  } catch (err) {
    console.error('Error connecting to Redis:', err.message);

    setTimeout(() => {
      console.log('Retrying connection to Redis...');
      connectRedis();
    }, 5000); 
  }
};

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
});

redisClient.on('end', () => {
  console.warn('Redis client disconnected. Attempting to reconnect...');
  connectRedis();
});

const shutdownRedis = async () => {
  try {
    if (redisClient.isOpen) {
      console.log('Closing Redis connection...');
      await redisClient.quit();
      console.log('Redis connection closed successfully');
    }
  } catch (err) {
    console.error('Error while closing Redis connection:', err.message);
  }
};

process.on('SIGINT', async () => {
  await shutdownRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdownRedis();
  process.exit(0);
});

module.exports = { redisClient, connectRedis };
