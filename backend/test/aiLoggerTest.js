// test.js
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '../.env')
});

const { generateInterviewQuestions, gradeEssay } = require('../services/aiService');

async function test() {
  console.log('Test generate questions...');
  const questions = await generateInterviewQuestions('React', 'medium');
  console.log('MCQ count:', questions.mcq.length);
  console.log('Essay count:', questions.text.length);

  console.log('\nTest grade essay...');
  const result = await gradeEssay(
    'What is React state?',
    'State is data that changes over time and causes re-renders.',
    ['state', 'data', 're-render']
  );
  console.log('Score:', result.score);
  console.log('Feedback:', result.feedback);
}

test().catch(console.error);