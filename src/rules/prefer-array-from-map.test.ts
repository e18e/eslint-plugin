import {RuleTester} from 'eslint';
import {preferArrayFromMap} from './prefer-array-from-map.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-array-from-map', preferArrayFromMap, {
  valid: [
    // Already using Array.from with mapper
    'const result = Array.from(iterable, x => x * 2)',
    'const result = Array.from(arr, mapper)',

    // Spread without .map()
    'const arr = [...iterable]',

    // .map() on a regular array (not from spread)
    'const result = arr.map(x => x * 2)',
    'const result = [1, 2, 3].map(x => x * 2)',

    // Array with multiple elements (not just a single spread)
    'const result = [...arr1, ...arr2].map(x => x * 2)',
    'const result = [1, ...arr].map(x => x * 2)',
    'const result = [...arr, 2].map(x => x * 2)',

    // .map() with multiple arguments (thisArg)
    'const result = [...arr].map(fn, thisArg)',

    // No spread in array literal
    'const result = [arr].map(x => x * 2)',

    // Empty array
    'const result = [].map(x => x * 2)'
  ],

  invalid: [
    // Basic case with arrow function
    {
      code: 'const result = [...arr].map(x => x * 2)',
      output: 'const result = Array.from(arr, x => x * 2)',
      errors: [
        {
          messageId: 'preferArrayFrom',
          data: {iterable: 'arr', mapper: 'x => x * 2'}
        }
      ]
    },

    // With named function
    {
      code: 'const result = [...items].map(double)',
      output: 'const result = Array.from(items, double)',
      errors: [
        {
          messageId: 'preferArrayFrom',
          data: {iterable: 'items', mapper: 'double'}
        }
      ]
    },

    // With function expression
    {
      code: 'const result = [...list].map(function(x) { return x * 2 })',
      output: 'const result = Array.from(list, function(x) { return x * 2 })',
      errors: [
        {
          messageId: 'preferArrayFrom',
          data: {iterable: 'list', mapper: 'function(x) { return x * 2 }'}
        }
      ]
    },

    // With method call on iterable
    {
      code: 'const result = [...map.values()].map(process)',
      output: 'const result = Array.from(map.values(), process)',
      errors: [
        {
          messageId: 'preferArrayFrom',
          data: {iterable: 'map.values()', mapper: 'process'}
        }
      ]
    },

    // Multiple occurrences
    {
      code: `const a = [...arr1].map(x => x * 2)
const b = [...arr2].map(y => y + 1)`,
      output: `const a = Array.from(arr1, x => x * 2)
const b = Array.from(arr2, y => y + 1)`,
      errors: [
        {
          messageId: 'preferArrayFrom',
          data: {iterable: 'arr1', mapper: 'x => x * 2'}
        },
        {
          messageId: 'preferArrayFrom',
          data: {iterable: 'arr2', mapper: 'y => y + 1'}
        }
      ]
    },

    // Used in return statement
    {
      code: 'function transform(items) { return [...items].map(x => x * 2) }',
      output:
        'function transform(items) { return Array.from(items, x => x * 2) }',
      errors: [
        {
          messageId: 'preferArrayFrom',
          data: {iterable: 'items', mapper: 'x => x * 2'}
        }
      ]
    },

    // Used in expression
    {
      code: 'console.log([...data].map(format))',
      output: 'console.log(Array.from(data, format))',
      errors: [
        {
          messageId: 'preferArrayFrom',
          data: {iterable: 'data', mapper: 'format'}
        }
      ]
    },

    // Complex iterable expression
    {
      code: 'const result = [...getItems()].map(x => x.id)',
      output: 'const result = Array.from(getItems(), x => x.id)',
      errors: [
        {
          messageId: 'preferArrayFrom',
          data: {iterable: 'getItems()', mapper: 'x => x.id'}
        }
      ]
    },

    // With member expression
    {
      code: 'const result = [...this.items].map(process)',
      output: 'const result = Array.from(this.items, process)',
      errors: [
        {
          messageId: 'preferArrayFrom',
          data: {iterable: 'this.items', mapper: 'process'}
        }
      ]
    },

    // Chained with other array methods
    {
      code: 'const doubled = [...numbers].map(n => n * 2).filter(n => n > 10)',
      output:
        'const doubled = Array.from(numbers, n => n * 2).filter(n => n > 10)',
      errors: [
        {
          messageId: 'preferArrayFrom',
          data: {iterable: 'numbers', mapper: 'n => n * 2'}
        }
      ]
    }
  ]
});
