import {RuleTester} from 'eslint';
import {preferSpreadSyntax} from './prefer-spread-syntax.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-spread-syntax', preferSpreadSyntax, {
  valid: [
    'const combined = [...arr, ...other];',
    'const merged = {...obj1, ...obj2};',
    'const result = fn(...args);',

    // concat with no arguments
    'arr.concat();',

    // Array.from with mapper function (should keep as-is)
    'Array.from(iterable, x => x * 2);',
    'Array.from(arr, mapper);',

    // Array.from with object literal or spread
    'Array.from({length: 5});',
    'Array.from({length: N}).fill(0);',
    'Array.from(...args).fill(0)',

    // Already using spread
    'const arr = [...iterable];',

    // Object.assign with non-literal first argument
    'Object.assign(target, source);',
    'Object.assign(getTarget(), source);',

    // Object.assign with __proto__
    'Object.assign({__proto__: null}, obj);',
    'Object.assign({__proto__: proto, foo: 1}, obj);',

    // apply with context
    'fn.apply(context, args);',
    'obj.method.apply(obj, args);',

    // apply with only one argument
    'fn.apply(null);'
  ],

  invalid: [
    // Array concat single argument
    {
      code: 'const combined = arr.concat(other);',
      output: 'const combined = [...arr, ...other];',
      errors: [
        {
          messageId: 'preferSpreadArray',
          line: 1,
          column: 18
        }
      ]
    },

    // Array concat multiple arguments
    {
      code: 'const multi = arr.concat(a, b, c);',
      output: 'const multi = [...arr, ...a, ...b, ...c];',
      errors: [
        {
          messageId: 'preferSpreadArray',
          line: 1,
          column: 15
        }
      ]
    },

    // Array concat with array literal
    {
      code: 'const result = arr.concat([1, 2, 3]);',
      output: 'const result = [...arr, ...[1, 2, 3]];',
      errors: [
        {
          messageId: 'preferSpreadArray',
          line: 1,
          column: 16
        }
      ]
    },

    // Array concat chained expression
    {
      code: 'const result = [1, 2].concat([3, 4]);',
      output: 'const result = [...[1, 2], ...[3, 4]];',
      errors: [
        {
          messageId: 'preferSpreadArray',
          line: 1,
          column: 16
        }
      ]
    },

    // Array.from with single argument
    {
      code: 'const arr = Array.from(iterable);',
      output: 'const arr = [...iterable];',
      errors: [
        {
          messageId: 'preferSpreadArrayFrom',
          line: 1,
          column: 13
        }
      ]
    },

    // Array.from with Set
    {
      code: 'const arr = Array.from(new Set([1, 2, 3]));',
      output: 'const arr = [...new Set([1, 2, 3])];',
      errors: [
        {
          messageId: 'preferSpreadArrayFrom',
          line: 1,
          column: 13
        }
      ]
    },

    // Array.from with method call
    {
      code: 'const values = Array.from(map.values());',
      output: 'const values = [...map.values()];',
      errors: [
        {
          messageId: 'preferSpreadArrayFrom',
          line: 1,
          column: 16
        }
      ]
    },

    // Array.from in expression
    {
      code: 'console.log(Array.from(items));',
      output: 'console.log([...items]);',
      errors: [
        {
          messageId: 'preferSpreadArrayFrom',
          line: 1,
          column: 13
        }
      ]
    },

    // Object.assign three arguments
    {
      code: 'const triple = Object.assign({}, a, b, c);',
      output: 'const triple = {...a, ...b, ...c};',
      errors: [
        {
          messageId: 'preferSpreadObject',
          line: 1,
          column: 16
        }
      ]
    },

    // Object.assign non-empty object literal (single property)
    {
      code: 'const merged = Object.assign({foo: 1}, obj);',
      output: 'const merged = {foo: 1, ...obj};',
      errors: [
        {
          messageId: 'preferSpreadObject',
          line: 1,
          column: 16
        }
      ]
    },

    // Object.assign non-empty object literal (multiple properties)
    {
      code: 'const merged = Object.assign({foo: 1, bar: 2}, a, b);',
      output: 'const merged = {foo: 1, bar: 2, ...a, ...b};',
      errors: [
        {
          messageId: 'preferSpreadObject',
          line: 1,
          column: 16
        }
      ]
    },

    // Object.assign non-empty with shorthand property
    {
      code: 'const merged = Object.assign({foo}, obj);',
      output: 'const merged = {foo, ...obj};',
      errors: [
        {
          messageId: 'preferSpreadObject',
          line: 1,
          column: 16
        }
      ]
    },

    // Object.assign non-empty with computed property
    {
      code: 'const merged = Object.assign({[key]: value}, obj);',
      output: 'const merged = {[key]: value, ...obj};',
      errors: [
        {
          messageId: 'preferSpreadObject',
          line: 1,
          column: 16
        }
      ]
    },

    // Object.assign non-empty with quoted __proto__ is safe
    {
      code: 'const merged = Object.assign({"__proto__": null}, obj);',
      output: 'const merged = {"__proto__": null, ...obj};',
      errors: [
        {
          messageId: 'preferSpreadObject',
          line: 1,
          column: 16
        }
      ]
    },

    // Function.apply with null
    {
      code: 'const result = fn.apply(null, args);',
      output: 'const result = fn(...args);',
      errors: [
        {
          messageId: 'preferSpreadFunction',
          line: 1,
          column: 16
        }
      ]
    },

    // Function.apply with undefined
    {
      code: 'const result = fn.apply(undefined, args);',
      output: 'const result = fn(...args);',
      errors: [
        {
          messageId: 'preferSpreadFunction',
          line: 1,
          column: 16
        }
      ]
    },

    // Function.apply Math.max
    {
      code: 'const max = Math.max.apply(null, numbers);',
      output: 'const max = Math.max(...numbers);',
      errors: [
        {
          messageId: 'preferSpreadFunction',
          line: 1,
          column: 13
        }
      ]
    },

    // Multiple issues in one file
    {
      code: `const arr = [1, 2].concat([3, 4]);
const fromArray = Array.from(items);
const obj = Object.assign({}, {a: 1}, {b: 2});
const max = Math.max.apply(null, numbers);`,
      output: `const arr = [...[1, 2], ...[3, 4]];
const fromArray = [...items];
const obj = {...{a: 1}, ...{b: 2}};
const max = Math.max(...numbers);`,
      errors: [
        {
          messageId: 'preferSpreadArray',
          line: 1,
          column: 13
        },
        {
          messageId: 'preferSpreadArrayFrom',
          line: 2,
          column: 19
        },
        {
          messageId: 'preferSpreadObject',
          line: 3,
          column: 13
        },
        {
          messageId: 'preferSpreadFunction',
          line: 4,
          column: 13
        }
      ]
    }
  ]
});
