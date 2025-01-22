const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const Question = require('../models/question.model');
const { redisClient, connectRedis } = require('./redisClient');

const PROTO_PATH = path.join(__dirname, '../proto/question.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDefinition).questionService;

const startGrpcServer = async () => {
  try {
    await connectRedis();
    console.log('Connected to Redis');

    const server = new grpc.Server({
      'grpc.max_send_message_length': 2 * 1024 * 1024, // 2 MB
      'grpc.max_receive_message_length': 2 * 1024 * 1024, // 2 MB
    });

    const searchQuestionById = async (call, callback) => {
      const { id } = call.request;
      try {
        const result = await Question.findById(id);
        if (!result) {
          return callback(null, { success: false, message: 'Question not found' });
        }
        const formattedResult = {
          _id: result._id.toString(),
          title: result.title,
          type: result.type,
          anagramType: result.anagramType || null,
          blocks: result.blocks || [],
          solution: result.solution || null,
          options: result.options,
        };
        callback(null, { success: true, question:formattedResult });
      } catch (err) {
        console.error('Error in searchQuestionById:', err);
        callback({ code: grpc.status.INTERNAL, message: 'Internal server error' });
      }
    };

    // Search questions 
    const searchQuestions = async (call, callback) => {
      const { query, page = 1, limit = 80 } = call.request;
      try {
        const results = await Question.find({ title: { $regex: query, $options: 'i' } }).limit(80);    
        if (!results.length) {
          return callback(null, { success: false, message: 'No questions found' });
        }
        const formattedResults = results.map((q) => ({
          _id: q._id,
          title: q.title,
          type: q.type,
        }));
        callback(null, { success: true, questions: formattedResults });
      } catch (err) {
        console.error('Error in searchQuestions:', err);
        callback({ code: grpc.status.INTERNAL, message: 'Internal server error' });
      }
    };
    

    const autoCompleteSuggestions = async (call) => {
      const query = call.request.query;
      try {
        if (!redisClient.isOpen) {
          console.log('Redis client not open. Reconnecting...');
          await redisClient.connect();
        }
        const cachedSuggestions = await redisClient.get(query);
        if (cachedSuggestions) {
          const suggestions = JSON.parse(cachedSuggestions);
          suggestions.forEach((title) => {
            call.write({ title });
          });
          call.end();
          return;
        }

        const suggestions = await Question.find({ title: { $regex: `^${query}`, $options: 'i' } })
          .select('title')
          .limit(5);


        const suggestionTitles = suggestions.map((item) => item.title);
        await redisClient.set(query, JSON.stringify(suggestionTitles), { EX: 3600 });
        suggestionTitles.forEach((title) => {
          call.write({ title });
        });
    
        call.end();
      } catch (err) {
        console.error('Error in autoCompleteSuggestions:', err);
        call.end();
      }
    };
    
    server.addService(proto.QuestionService.service, {
      searchQuestions,
      autoCompleteSuggestions,
      searchQuestionById,  
    });

    // Start the gRPC server
    const GRPC_SERVER_PORT=process.env.GRPC_SERVER_PORT;
    server.bindAsync(`0.0.0.0:${GRPC_SERVER_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
      if (err) {
        console.error('Failed to bind gRPC server:', err);
        return;
      }
      console.log(`gRPC server running on ${GRPC_SERVER_PORT}`);
    });

  } catch (err) {
    console.error('Failed to start gRPC server:', err);
    process.exit(1);
  }
};

module.exports = startGrpcServer;