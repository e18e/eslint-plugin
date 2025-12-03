import {RuleTester} from 'eslint';
import {preferArrayToSpliced} from './prefer-array-to-spliced.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-array-to-spliced', preferArrayToSpliced, {
  valid: [
    'arr.splice(0, 1);',
    'const modified = arr.splice(2, 3);',

    // Other array methods
    'const mapped = arr.map(x => x * 2);',
    'const arr = [1, 2, 3];',

    // slice with different arguments
    'arr.slice(1).splice(0, 1);',
    'arr.slice(0, 5).splice(1, 2);'
  ],

  invalid: [
    // concat().splice()
    {
      code: 'const copy = arr.concat().splice(0, 1);',
      output: 'const copy = arr.toSpliced(0, 1);',
      errors: [
        {
          messageId: 'preferToSpliced',
          data: {array: 'arr'},
          line: 1,
          column: 14
        }
      ]
    },

    // slice().splice()
    {
      code: 'const copy = arr.slice().splice(1, 2);',
      output: 'const copy = arr.toSpliced(1, 2);',
      errors: [
        {
          messageId: 'preferToSpliced',
          data: {array: 'arr'},
          line: 1,
          column: 14
        }
      ]
    },

    // slice(0).splice()
    {
      code: 'const copy = arr.slice(0).splice(0, 1);',
      output: 'const copy = arr.toSpliced(0, 1);',
      errors: [
        {
          messageId: 'preferToSpliced',
          data: {array: 'arr'},
          line: 1,
          column: 14
        }
      ]
    },

    // [...arr].splice()
    {
      code: 'const copy = [...arr].splice(2, 3);',
      output: 'const copy = arr.toSpliced(2, 3);',
      errors: [
        {
          messageId: 'preferToSpliced',
          data: {array: 'arr'},
          line: 1,
          column: 14
        }
      ]
    },

    // Multiple arguments (splice with items to insert)
    {
      code: "const copy = arr.concat().splice(1, 2, 'a', 'b');",
      output: "const copy = arr.toSpliced(1, 2, 'a', 'b');",
      errors: [
        {
          messageId: 'preferToSpliced',
          data: {array: 'arr'},
          line: 1,
          column: 14
        }
      ]
    },

    // Complex expressions
    {
      code: 'const copy = obj.data.items.slice().splice(0, 1);',
      output: 'const copy = obj.data.items.toSpliced(0, 1);',
      errors: [
        {
          messageId: 'preferToSpliced',
          data: {array: 'obj.data.items'},
          line: 1,
          column: 14
        }
      ]
    },
    {
      code: 'function foo() { return [...this.items].splice(1, 2); }',
      output: 'function foo() { return this.items.toSpliced(1, 2); }',
      errors: [
        {
          messageId: 'preferToSpliced',
          data: {array: 'this.items'},
          line: 1,
          column: 25
        }
      ]
    }
  ]
});
