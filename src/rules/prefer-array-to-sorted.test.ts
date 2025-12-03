import {RuleTester} from 'eslint';
import {preferArrayToSorted} from './prefer-array-to-sorted.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-array-to-sorted', preferArrayToSorted, {
  valid: [
    'const sorted = arr.sort();',
    'arr.sort((a, b) => a - b);',

    // Other array methods
    'const mapped = arr.map(x => x * 2);',
    'const arr = [1, 2, 3];',

    // slice with different arguments
    'arr.slice(1).sort();',
    'arr.slice(0, 5).sort();'
  ],

  invalid: [
    // concat().sort()
    {
      code: 'const sorted = arr.concat().sort((a, b) => a - b);',
      output: 'const sorted = arr.toSorted((a, b) => a - b);',
      errors: [
        {
          messageId: 'preferToSorted',
          data: {array: 'arr'},
          line: 1,
          column: 16
        }
      ]
    },
    {
      code: 'const sorted = arr.concat().sort();',
      output: 'const sorted = arr.toSorted();',
      errors: [
        {
          messageId: 'preferToSorted',
          data: {array: 'arr'},
          line: 1,
          column: 16
        }
      ]
    },

    // slice().sort()
    {
      code: 'const sorted = arr.slice().sort();',
      output: 'const sorted = arr.toSorted();',
      errors: [
        {
          messageId: 'preferToSorted',
          data: {array: 'arr'},
          line: 1,
          column: 16
        }
      ]
    },
    {
      code: 'const sorted = myArray.slice().sort((a, b) => b - a);',
      output: 'const sorted = myArray.toSorted((a, b) => b - a);',
      errors: [
        {
          messageId: 'preferToSorted',
          data: {array: 'myArray'},
          line: 1,
          column: 16
        }
      ]
    },

    // slice(0).sort()
    {
      code: 'const sorted = arr.slice(0).sort((a, b) => b - a);',
      output: 'const sorted = arr.toSorted((a, b) => b - a);',
      errors: [
        {
          messageId: 'preferToSorted',
          data: {array: 'arr'},
          line: 1,
          column: 16
        }
      ]
    },
    {
      code: 'const sorted = arr.slice(0).sort();',
      output: 'const sorted = arr.toSorted();',
      errors: [
        {
          messageId: 'preferToSorted',
          data: {array: 'arr'},
          line: 1,
          column: 16
        }
      ]
    },

    // [...arr].sort()
    {
      code: 'const sorted = [...arr].sort();',
      output: 'const sorted = arr.toSorted();',
      errors: [
        {
          messageId: 'preferToSorted',
          data: {array: 'arr'},
          line: 1,
          column: 16
        }
      ]
    },
    {
      code: 'const sorted = [...myArray].sort((a, b) => a - b);',
      output: 'const sorted = myArray.toSorted((a, b) => a - b);',
      errors: [
        {
          messageId: 'preferToSorted',
          data: {array: 'myArray'},
          line: 1,
          column: 16
        }
      ]
    },

    // Complex expressions
    {
      code: 'const sorted = obj.data.items.slice().sort();',
      output: 'const sorted = obj.data.items.toSorted();',
      errors: [
        {
          messageId: 'preferToSorted',
          data: {array: 'obj.data.items'},
          line: 1,
          column: 16
        }
      ]
    },
    {
      code: 'function foo() { return [...this.items].sort((a, b) => a.id - b.id); }',
      output:
        'function foo() { return this.items.toSorted((a, b) => a.id - b.id); }',
      errors: [
        {
          messageId: 'preferToSorted',
          data: {array: 'this.items'},
          line: 1,
          column: 25
        }
      ]
    },

    // Multiple arguments (edge case - sort() typically takes 0 or 1 arg)
    {
      code: 'const sorted = arr.slice().sort(arg1, arg2);',
      output: 'const sorted = arr.toSorted(arg1, arg2);',
      errors: [
        {
          messageId: 'preferToSorted',
          data: {array: 'arr'},
          line: 1,
          column: 16
        }
      ]
    }
  ]
});
