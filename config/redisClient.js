const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  url: `${process.env.REDIS_URL}`,  
});

// Ensure the Redis client remains connected
redisClient.on('end', () => {
  console.warn('Redis client disconnected. Attempting to reconnect...');
  connectRedis().catch((err) => console.error('Error reconnecting to Redis:', err.message));
});

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('Connected to Redis');
    }
  } catch (err) {
    console.error('Error connecting to Redis:', err.message);
    process.exit(1); 
  }
};

module.exports = { redisClient, connectRedis };





