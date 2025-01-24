const express = require('express');
const connectDB = require('./config/db');
const startGrpcServer = require('./config/grpcServer');
const questionRoutes = require('./routes/questionRoutes');
const cors=require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Express Middleware
app.use(cors());
app.use(express.json());
app.use('/api', questionRoutes);
app.get('/',(req,res)=>{
  res.json({success: true,message: 'Server is Runing 🏃'});
})

const startExpressServer = () => {
  app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`)
  });
};

// Start All Servers
const startAllServers = async () => {
  try {
    await connectDB();
    startGrpcServer();
    startExpressServer();
    console.log("All server runing 🏃");
  } catch (error) {
    console.error('Error starting servers:', error);
    process.exit(1); 
};
}

startAllServers();
