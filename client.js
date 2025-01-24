const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = __dirname + '/proto/question.proto';  

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const proto = grpc.loadPackageDefinition(packageDefinition).questionService;

const GRPC_SERVER_URL=process.env.GRPC_SERVER_URL;
const client = new proto.QuestionService(`${GRPC_SERVER_URL}`, grpc.credentials.createInsecure());

