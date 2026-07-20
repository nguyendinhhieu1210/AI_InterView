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

function runClosureValidation() {
  const exampleInput = '[1,-7,20,-3,-6]';
  const incorrectOutput = '27';

  const result = validateAndFixExampleOutput(
    exampleInput,
    incorrectOutput,
    'Create a function that demonstrates lexical scoping in JavaScript. It should take an array of numbers and a multiplier as input, and return a new array where each element is multiplied by the multiplier.',
    'javascript'
  );

  assert.strictEqual(
    result.isValid,
    false,
    'Expected validation to flag the incorrect closure output'
  );
  assert.deepStrictEqual(
    JSON.parse(result.fixedOutput),
    [2, -14, 40, -6, -12],
    'Expected closure output to be the multiplied array using the default multiplier of 2'
  );

  console.log('Closure output validation test passed');
}

run();
runClosureValidation();
