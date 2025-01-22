const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  text: String,
  showInOption: Boolean,
  isAnswer: Boolean,
});

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['MCQ', 'ANAGRAM', 'READ_ALONG', 'CONTENT_ONLY'], required: true },
  title: { type: String, required: true },
  options: [
    {
      text: String,
      isCorrectAnswer: Boolean,
    },
  ],
  anagramType: { type: String, enum: ['WORD', 'SENTENCE'] },
  blocks: [blockSchema],
  solution: String,
  siblingId: mongoose.Schema.Types.ObjectId,
});

questionSchema.index({ title: 'text' });

module.exports = mongoose.model('Question', questionSchema,'Questions');
