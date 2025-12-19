import {RuleTester} from 'eslint';
import {preferArrayAt} from './prefer-array-at.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-array-at', preferArrayAt, {
  valid: [
    // Already using .at()
    'const last = myArray.at(-1)',
    'const last = arr.at(-1)',

    // Different indices
    'const first = myArray[0]',
    'const second = myArray[1]',
    'const item = myArray[myArray.length - 2]',

    // Different arrays (array mismatch)
    'const item = arr1[arr2.length - 1]',

    // Non-computed access
    'const length = myArray.length',

    // Different operators
    'const item = myArray[myArray.length + 1]',
    'const item = myArray[myArray.length * 1]',

    // Different subtraction value
    'const item = myArray[myArray.length - 0]',

    // Not a .length property
    'const item = myArray[myArray.size - 1]',

    // Edge cases
    'const empty = []',
    'const literal = [1, 2, 3][0]',

    // Assignments
    'arr[arr.length - 1] = value',
    'myArray[myArray.length - 1] = 42'
  ],

  invalid: [
    // Basic case
    {
      code: 'const last = myArray[myArray.length - 1]',
      output: 'const last = myArray.at(-1)',
      errors: [
        {
          messageId: 'preferAt',
          data: {array: 'myArray'}
        }
      ]
    },

    // Different variable names
    {
      code: 'const last = arr[arr.length - 1]',
      output: 'const last = arr.at(-1)',
      errors: [
        {
          messageId: 'preferAt',
          data: {array: 'arr'}
        }
      ]
    },
    {
      code: 'const last = items[items.length - 1]',
      output: 'const last = items.at(-1)',
      errors: [
        {
          messageId: 'preferAt',
          data: {array: 'items'}
        }
      ]
    },

    // Multiple occurrences
    {
      code: `const last1 = arr1[arr1.length - 1]
const last2 = arr2[arr2.length - 1]`,
      output: `const last1 = arr1.at(-1)
const last2 = arr2.at(-1)`,
      errors: [
        {
          messageId: 'preferAt',
          data: {array: 'arr1'}
        },
        {
          messageId: 'preferAt',
          data: {array: 'arr2'}
        }
      ]
    },

    // Used in expressions
    {
      code: 'console.log(myArray[myArray.length - 1])',
      output: 'console.log(myArray.at(-1))',
      errors: [
        {
          messageId: 'preferAt',
          data: {array: 'myArray'}
        }
      ]
    },

    // Used in conditionals
    {
      code: 'if (arr[arr.length - 1] === "end") {}',
      output: 'if (arr.at(-1) === "end") {}',
      errors: [
        {
          messageId: 'preferAt',
          data: {array: 'arr'}
        }
      ]
    },

    // Used in return statements
    {
      code: 'function getLast(items) { return items[items.length - 1] }',
      output: 'function getLast(items) { return items.at(-1) }',
      errors: [
        {
          messageId: 'preferAt',
          data: {array: 'items'}
        }
      ]
    },

    // With member expression objects
    {
      code: 'const last = this.items[this.items.length - 1]',
      output: 'const last = this.items.at(-1)',
      errors: [
        {
          messageId: 'preferAt',
          data: {array: 'this.items'}
        }
      ]
    },

    // Function call results
    {
      code: 'const last = getArray()[getArray().length - 1]',
      output: 'const last = getArray().at(-1)',
      errors: [
        {
          messageId: 'preferAt',
          data: {array: 'getArray()'}
        }
      ]
    }
  ]
});
