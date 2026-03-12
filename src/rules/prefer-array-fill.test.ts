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
    'const arr = [...Array(5)].map(() => faker.lorem.sentences(3))',
    'const arr = [...Array(5)].map(() => Math.random())',
    'const arr = [...Array(3)].map(function() { return Math.random() })',
    'const arr = Array.from({length: 5}, () => new Date())',
    'const arr = [...Array(5)].map(() => new Foo())'
  ],

  invalid: [
    // Array.from with arrow function returning constant
    {
      code: 'const arr = Array.from({length: 5}, () => 0)',
      output: 'const arr = Array.from({length: 5}).fill(0)',
      errors: [
        {
          messageId: 'preferFillArrayFrom',
          data: {length: '5', value: '0'}
        }
      ]
    },

    // Array.from with string value
    {
      code: 'const arr = Array.from({length: 3}, () => "test")',
      output: 'const arr = Array.from({length: 3}).fill("test")',
      errors: [
        {
          messageId: 'preferFillArrayFrom',
          data: {length: '3', value: '"test"'}
        }
      ]
    },

    // Array.from with expression in length
    {
      code: 'const arr = Array.from({length: 2 + 3}, () => 0)',
      output: 'const arr = Array.from({length: 2 + 3}).fill(0)',
      errors: [
        {
          messageId: 'preferFillArrayFrom',
          data: {length: '2 + 3', value: '0'}
        }
      ]
    },

    // Array.from with object value
    {
      code: 'const arr = Array.from({length: 5}, () => ({}))',
      output: 'const arr = Array.from({length: 5}).fill({})',
      errors: [
        {
          messageId: 'preferFillArrayFrom',
          data: {length: '5', value: '{}'}
        }
      ]
    },

    // Array.from with regular function expression
    {
      code: 'const arr = Array.from({length: 5}, function() { return 0 })',
      output: 'const arr = Array.from({length: 5}).fill(0)',
      errors: [
        {
          messageId: 'preferFillArrayFrom',
          data: {length: '5', value: '0'}
        }
      ]
    },

    // Spread Array with map and arrow function
    {
      code: 'const arr = [...Array(5)].map(() => 0)',
      output: 'const arr = Array(5).fill(0)',
      errors: [
        {
          messageId: 'preferFillSpreadMap',
          data: {length: '5', value: '0'}
        }
      ]
    },

    // Spread Array with map and string value
    {
      code: 'const arr = [...Array(3)].map(() => "test")',
      output: 'const arr = Array(3).fill("test")',
      errors: [
        {
          messageId: 'preferFillSpreadMap',
          data: {length: '3', value: '"test"'}
        }
      ]
    },

    // Spread Array with map and expression
    {
      code: 'const arr = [...Array(10)].map(() => [])',
      output: 'const arr = Array(10).fill([])',
      errors: [
        {
          messageId: 'preferFillSpreadMap',
          data: {length: '10', value: '[]'}
        }
      ]
    },

    // Spread Array with map and function expression
    {
      code: 'const arr = [...Array(5)].map(function() { return 1 })',
      output: 'const arr = Array(5).fill(1)',
      errors: [
        {
          messageId: 'preferFillSpreadMap',
          data: {length: '5', value: '1'}
        }
      ]
    },

    // Multiple occurrences
    {
      code: `const arr1 = Array.from({length: 5}, () => 0);
const arr2 = [...Array(3)].map(() => "test");`,
      output: `const arr1 = Array.from({length: 5}).fill(0);
const arr2 = Array(3).fill("test");`,
      errors: [
        {
          messageId: 'preferFillArrayFrom',
          data: {length: '5', value: '0'}
        },
        {
          messageId: 'preferFillSpreadMap',
          data: {length: '3', value: '"test"'}
        }
      ]
    },

    // Used in expressions
    {
      code: 'console.log(Array.from({length: 5}, () => 0))',
      output: 'console.log(Array.from({length: 5}).fill(0))',
      errors: [
        {
          messageId: 'preferFillArrayFrom',
          data: {length: '5', value: '0'}
        }
      ]
    },

    // Used in return statements
    {
      code: 'function getArray() { return [...Array(5)].map(() => 0) }',
      output: 'function getArray() { return Array(5).fill(0) }',
      errors: [
        {
          messageId: 'preferFillSpreadMap',
          data: {length: '5', value: '0'}
        }
      ]
    },

    // Variable length
    {
      code: 'const arr = Array.from({length: n}, () => 0)',
      output: 'const arr = Array.from({length: n}).fill(0)',
      errors: [
        {
          messageId: 'preferFillArrayFrom',
          data: {length: 'n', value: '0'}
        }
      ]
    },

    // Complex expressions in value
    {
      code: 'const arr = [...Array(5)].map(() => 1 + 2)',
      output: 'const arr = Array(5).fill(1 + 2)',
      errors: [
        {
          messageId: 'preferFillSpreadMap',
          data: {length: '5', value: '1 + 2'}
        }
      ]
    }
  ]
});
