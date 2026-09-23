import {RuleTester} from 'eslint';
import {preferArrayFill} from './prefer-array-fill.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-array-fill', preferArrayFill, {
  valid: [
    // Already using .fill()
    'const arr = Array.from({length: 5}).fill(0)',
    'const arr = Array(5).fill(0)',

    // Array.from with index parameter (not constant)
    'const arr = Array.from({length: 5}, (_, i) => i)',
    'const arr = Array.from({length: 5}, (v, i) => i)',

    // Spread Array with map using index parameter (not constant)
    'const arr = [...Array(5)].map((_, i) => i)',
    'const arr = [...Array(5)].map((v, i) => i * 2)',

    // Regular array creation
    'const arr = [1, 2, 3]',
    'const arr = []',

    // Array.from with different arguments
    'const arr = Array.from("hello")',
    'const arr = Array.from({length: 5})',

    // Map without spread Array
    'const arr = someArray.map(() => 0)',

    // Different patterns
    'const arr = new Array(5)',
    'const arr = Array(5)',

    // Non-constant callback - function call that could return different values each time
    'const arr = Array.from({length: 5}, () => faker.lorem.sentences(3))',
    'const arr = Array.from({length: 5}, () => Math.random())',
    'const arr = Array.from({length: 3}, function() { return faker.lorem.sentences(3) })',
    'const arr = Array.from({length: 5}, () => new Date())',
    'const arr = Array.from({length: 5}, () => [])',
    'const arr = [...Array(5)].map(() => faker.lorem.sentences(3))',
    'const arr = [...Array(5)].map(() => Math.random())',
    'const arr = [...Array(3)].map(function() { return Math.random() })',
    'const arr = [...Array(5)].map(() => new Foo())',

    // Non-constant callback - object/array literal creates new value each time
    'const arr = Array.from({length: 5}, () => ({}))',
    'const arr = [...Array(5)].map(() => [])',

    // Non-constant callback - logical/conditional containing a call
    'const arr = Array.from({length: 5}, () => a || getVal())',
    'const arr = [...Array(5)].map(() => a ? getVal() : b)'
  ],

  invalid: [
    // Array.from with arrow function returning constant
    {
      code: 'const arr = Array.from({length: 5}, () => 0)',
      output: 'const arr = Array.from({length: 5}).fill(0)',
      errors: [{messageId: 'preferFillArrayFrom'}]
    },

    // Array.from with string value
    {
      code: 'const arr = Array.from({length: 3}, () => "test")',
      output: 'const arr = Array.from({length: 3}).fill("test")',
      errors: [{messageId: 'preferFillArrayFrom'}]
    },

    // Array.from with expression in length
    {
      code: 'const arr = Array.from({length: 2 + 3}, () => 0)',
      output: 'const arr = Array.from({length: 2 + 3}).fill(0)',
      errors: [{messageId: 'preferFillArrayFrom'}]
    },

    // Array.from with regular function expression
    {
      code: 'const arr = Array.from({length: 5}, function() { return 0 })',
      output: 'const arr = Array.from({length: 5}).fill(0)',
      errors: [{messageId: 'preferFillArrayFrom'}]
    },

    // Spread Array with map and arrow function
    {
      code: 'const arr = [...Array(5)].map(() => 0)',
      output: 'const arr = Array(5).fill(0)',
      errors: [{messageId: 'preferFillSpreadMap'}]
    },

    // Spread Array with map and string value
    {
      code: 'const arr = [...Array(3)].map(() => "test")',
      output: 'const arr = Array(3).fill("test")',
      errors: [{messageId: 'preferFillSpreadMap'}]
    },

    // Spread Array with map and function expression
    {
      code: 'const arr = [...Array(5)].map(function() { return 1 })',
      output: 'const arr = Array(5).fill(1)',
      errors: [{messageId: 'preferFillSpreadMap'}]
    },

    // Multiple occurrences
    {
      code: `const arr1 = Array.from({length: 5}, () => 0);
const arr2 = [...Array(3)].map(() => "test");`,
      output: `const arr1 = Array.from({length: 5}).fill(0);
const arr2 = Array(3).fill("test");`,
      errors: [
        {messageId: 'preferFillArrayFrom'},
        {messageId: 'preferFillSpreadMap'}
      ]
    },

    // Used in expressions
    {
      code: 'console.log(Array.from({length: 5}, () => 0))',
      output: 'console.log(Array.from({length: 5}).fill(0))',
      errors: [{messageId: 'preferFillArrayFrom'}]
    },

    // Used in return statements
    {
      code: 'function getArray() { return [...Array(5)].map(() => 0) }',
      output: 'function getArray() { return Array(5).fill(0) }',
      errors: [{messageId: 'preferFillSpreadMap'}]
    },

    // Variable length
    {
      code: 'const arr = Array.from({length: n}, () => 0)',
      output: 'const arr = Array.from({length: n}).fill(0)',
      errors: [{messageId: 'preferFillArrayFrom'}]
    },

    // Complex expressions in value
    {
      code: 'const arr = [...Array(5)].map(() => 1 + 2)',
      output: 'const arr = Array(5).fill(1 + 2)',
      errors: [{messageId: 'preferFillSpreadMap'}]
    },

    // Logical expression with all-constant operands
    {
      code: 'const arr = Array.from({length: 5}, () => a ?? b)',
      output: 'const arr = Array.from({length: 5}).fill(a ?? b)',
      errors: [{messageId: 'preferFillArrayFrom'}]
    },

    // Conditional expression with all-constant branches
    {
      code: 'const arr = [...Array(5)].map(() => a ? b : c)',
      output: 'const arr = Array(5).fill(a ? b : c)',
      errors: [{messageId: 'preferFillSpreadMap'}]
    }
  ]
});
