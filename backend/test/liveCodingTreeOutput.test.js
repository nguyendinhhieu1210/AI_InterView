const assert = require('assert');
const {
  validateAndFixExampleOutput,
} = require('../services/liveCoding/llmProvider');

function run() {
  const exampleInput = '[-34,13,-1,43,-31,-42,8]';
  const incorrectOutput = '[-68,26,-2,86,-62,-84,16]';

  const result = validateAndFixExampleOutput(
    exampleInput,
    incorrectOutput,
    'Write a function that takes a binary tree represented as a level-order array and returns a new array with all node values multiplied by 2',
    'javascript'
  );

  assert.strictEqual(
    result.isValid,
    false,
    'Expected validation to flag the incorrect tree output'
  );
  assert.deepStrictEqual(
    JSON.parse(result.fixedOutput),
    [-68, 26, -1, 86, -62, -84, 16],
    'Expected null nodes to be preserved while numeric nodes are doubled'
  );

  console.log('Tree output validation test passed');
}

run();
