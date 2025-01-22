const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = __dirname + '/proto/question.proto';  /

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const proto = grpc.loadPackageDefinition(packageDefinition).questionService;

const GRPC_SERVER_URL=process.env.GRPC_SERVER_URL;
const client = new proto.QuestionService(`${GRPC_SERVER_URL}`, grpc.credentials.createInsecure());

// Define the search query parameters
const searchRequest = {
  query: 'math',   // Search term
  page: 1,         // Pagination: Page 1
  limit: 10,       // Limit results to 10 questions
};

// // Call the `searchQuestions` method on the gRPC service
// client.searchQuestions(searchRequest, (error, response) => {
//   if (error) {
//     console.error('Error:', error);
//   } else {
//     if (response && response.success) {
//       console.log('Search Results:');
//       response.questions.forEach((question, index) => {
//         console.log(`Question ${index + 1}: ${question.title}`);
//       });
//     } else {
//       console.log('No questions found for your query.');
//     }
//   }
// });
