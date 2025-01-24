const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = __dirname + '/../proto/question.proto';  

const router = express.Router();

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const proto = grpc.loadPackageDefinition(packageDefinition).questionService;

const client = new proto.QuestionService('localhost:50051', grpc.credentials.createInsecure());


router.get('/questions', (req, res) => {
  const query = req.query.query || '';            
  const page = parseInt(req.query.page, 10) || 1;  
  const limit = parseInt(req.query.limit, 10) || 20; 
  const type = req.query.type || 'all';           
  const types = type === 'all' ? [] : type.split(',');

  client.searchQuestions({ query, page, limit, type: types }, (err, response) => {
    if (err) {
      console.error('gRPC error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while searching for questions',
        error: err.message,
      });
    }

    if (!response.questions || response.questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions found',
      });
    }

    res.status(200).json({
      success: true,
      questions: response.questions,
      pagination: response.pagination || null,
    });
  });
});



router.get('/questionsById/:id', (req, res) => {
  const { id } = req.params;

  client.searchQuestionById({ id }, (err, response) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Internal server error', error: err });
    }

    if (!response.success) {
      return res.status(404).json({ success: false, message: response.message });
    }

    res.status(200).json({ success: true, question: response.question });
  });
});


// Route for auto-complete suggestions
router.get('/autocomplete', (req, res) => {
  const query = req.query.query || '';

  if (!query.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Query parameter is required',
    });
  }

  const call = client.autoCompleteSuggestions({ query });

  const suggestions = [];

  call.on('data', (response) => {
    if (response.title) {
      suggestions.push(response.title);
    }
  });

  call.on('end', () => {
    if (suggestions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No suggestions found',
      });
    }

    res.status(200).json({
      success: true,
      suggestions,
    });
  });

  call.on('error', (err) => {
    console.error('Error in auto-complete suggestions:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  });
});



module.exports = router;
