import {RuleTester} from 'eslint';
import {preferArrayToReversed} from './prefer-array-to-reversed.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-array-to-reversed', preferArrayToReversed, {
  valid: [
    'const reversed = arr.reverse();',
    'arr.reverse();',

    // slice with non-zero argument
    'const reversed = arr.slice(1).reverse();',
    'const reversed = arr.slice(0, 5).reverse();',

    // Already using toReversed
    'const reversed = arr.toReversed();',

    // reversing other results
    'const filtered = arr.filter(x => x > 0).reverse();',
    'const mapped = arr.map(x => x * 2).reverse();'
  ],

  invalid: [
    // concat().reverse()
    {
      code: 'const reversed = arr.concat().reverse();',
      output: 'const reversed = arr.toReversed();',
      errors: [{messageId: 'preferToReversed', data: {array: 'arr'}}]
    },

    // slice().reverse()
    {
      code: 'const reversed = arr.slice().reverse();',
      output: 'const reversed = arr.toReversed();',
      errors: [{messageId: 'preferToReversed', data: {array: 'arr'}}]
    },

    // slice(0).reverse()
    {
      code: 'const reversed = arr.slice(0).reverse();',
      output: 'const reversed = arr.toReversed();',
      errors: [{messageId: 'preferToReversed', data: {array: 'arr'}}]
    },

    // [...array].reverse()
    {
      code: 'const reversed = [...arr].reverse();',
      output: 'const reversed = arr.toReversed();',
      errors: [{messageId: 'preferToReversed', data: {array: 'arr'}}]
    },

    // Member expressions
    {
      code: 'const reversed = obj.arr.concat().reverse();',
      output: 'const reversed = obj.arr.toReversed();',
      errors: [{messageId: 'preferToReversed', data: {array: 'obj.arr'}}]
    },

    // Member expressions with slice
    {
      code: 'const reversed = obj.arr.slice().reverse();',
      output: 'const reversed = obj.arr.toReversed();',
      errors: [{messageId: 'preferToReversed', data: {array: 'obj.arr'}}]
    },

    // Member expressions with spread
    {
      code: 'const reversed = [...obj.arr].reverse();',
      output: 'const reversed = obj.arr.toReversed();',
      errors: [{messageId: 'preferToReversed', data: {array: 'obj.arr'}}]
    },

    // Without assignment
    {
      code: 'arr.concat().reverse();',
      output: 'arr.toReversed();',
      errors: [{messageId: 'preferToReversed', data: {array: 'arr'}}]
    },

    // Nested in expressions
    {
      code: 'console.log(arr.slice().reverse());',
      output: 'console.log(arr.toReversed());',
      errors: [{messageId: 'preferToReversed', data: {array: 'arr'}}]
    },

    // Complex expressions
    {
      code: 'const result = someFunc().slice(0).reverse();',
      output: 'const result = someFunc().toReversed();',
      errors: [{messageId: 'preferToReversed', data: {array: 'someFunc()'}}]
    }
  ]
});
