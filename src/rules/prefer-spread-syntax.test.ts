import {RuleTester} from 'eslint';
import {RuleTester as TSRuleTester} from '@typescript-eslint/rule-tester';
import {preferSpreadSyntax} from './prefer-spread-syntax.js';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const typedRuleTester = new TSRuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts'],
        defaultProject: './tsconfig.json'
      },
      tsconfigRootDir: rootDir
    }
  }
});
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-spread-syntax (untyped)', preferSpreadSyntax as never, {
  valid: [
    'const combined = [...arr, ...other];',
    'const merged = {...obj1, ...obj2};',
    'const result = fn(...args);',

    // concat with no arguments
    'arr.concat();',

    // Buffer.concat is not replaceable with spread
    'Buffer.concat([buf1, buf2]);',
    'Buffer.concat(buffers);',

    "'a'.concat('b');",
    '`hello`.concat(` world`);',
    'const stringWithConcat = "StringWithSubstring".substring(1, 5).concat("test");',
    'String(value).concat(suffix);',
    'JSON.stringify(value).concat("\\n");',
    'arr.join(",").concat(suffix);',

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

    // Object.assign with spread element argument — cannot be safely converted
    // Object.assign({}, ...objs) !== {...objs} (the latter spreads the array as an object)
    'Object.assign({}, ...objs);',
    'Object.assign({}, ...objs, extra);',

    // apply with context
    'fn.apply(context, args);',
    'obj.method.apply(obj, args);',

    // apply with only one argument
    'fn.apply(null);'
  ],

  invalid: [
    // Array concat single argument (when untyped, unknown args are not spread)
    {
      code: 'const combined = arr.concat(other);',
      output: 'const combined = [...arr, other];',
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
      output: 'const multi = [...arr, a, b, c];',
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
      output: 'const result = [...arr, 1, 2, 3];',
      errors: [
        {
          messageId: 'preferSpreadArray',
          line: 1,
          column: 16
        }
      ]
    },

    // Empty array concat
    {
      code: 'const result = [].concat(a, b);',
      output: 'const result = [a, b];',
      errors: [
        {
          messageId: 'preferSpreadArray',
          line: 1,
          column: 16
        }
      ]
    },

    // Array concat with .map() arg
    {
      code: 'const result = arr.concat(items.map(x => x));',
      output: 'const result = [...arr, ...items.map(x => x)];',
      errors: [{messageId: 'preferSpreadArray'}]
    },

    // Array concat with Array.from() arg
    {
      code: 'const result = arr.concat(Array.from(s, n => n));',
      output: 'const result = [...arr, ...Array.from(s, n => n)];',
      errors: [{messageId: 'preferSpreadArray'}]
    },

    // Array concat with Object.keys() arg
    {
      code: 'const result = arr.concat(Object.keys(obj));',
      output: 'const result = [...arr, ...Object.keys(obj)];',
      errors: [{messageId: 'preferSpreadArray'}]
    },

    {
      code: 'const result = Object.keys(obj).concat(other);',
      output: 'const result = [...Object.keys(obj), other];',
      errors: [{messageId: 'preferSpreadArray'}]
    },

    // Array concat chained expression
    {
      code: 'const result = [1, 2].concat([3, 4]);',
      output: 'const result = [1, 2, 3, 4];',
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
      output: `const arr = [1, 2, 3, 4];
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

typedRuleTester.run('prefer-spread-syntax (typed)', preferSpreadSyntax, {
  valid: [
    // Non-array object should not be flagged
    'const s: string = "hello"; s.concat(" world");',
    'const s = "hello"; s.concat(" world");',

    // concat with no arguments
    'const arr: number[] = [1]; arr.concat();',

    // Buffer.concat
    'Buffer.concat([]);',

    // concat with an argument that may or may not be an array
    'declare const arr: number[]; declare const x: number | number[]; arr.concat(x);',

    // Array.from with non-iterable array-like
    'declare const a: ArrayLike<number>; Array.from(a);',
    'declare const a: {length: number; 0: string}; Array.from(a);',
    'declare const a: number[] | ArrayLike<number>; Array.from(a);'
  ],

  invalid: [
    // Array concat with array argument
    {
      code: 'const arr: number[] = [1, 2]; const other: number[] = [3]; arr.concat(other);',
      output:
        'const arr: number[] = [1, 2]; const other: number[] = [3]; [...arr, ...other];',
      errors: [
        {
          messageId: 'preferSpreadArray',
          line: 1,
          column: 60,
          endLine: 1,
          endColumn: 77
        }
      ]
    },

    // Array concat with non-array argument
    {
      code: 'const arr: number[] = [1, 2]; const n: number = 3; arr.concat(n);',
      output: 'const arr: number[] = [1, 2]; const n: number = 3; [...arr, n];',
      errors: [
        {
          messageId: 'preferSpreadArray',
          line: 1,
          column: 52,
          endLine: 1,
          endColumn: 65
        }
      ]
    },

    // Mixed array and non-array arguments
    {
      code: 'const arr: number[] = [1]; const other: number[] = [2]; const n: number = 3; arr.concat(other, n);',
      output:
        'const arr: number[] = [1]; const other: number[] = [2]; const n: number = 3; [...arr, ...other, n];',
      errors: [
        {
          messageId: 'preferSpreadArray',
          line: 1,
          column: 78,
          endLine: 1,
          endColumn: 98
        }
      ]
    },

    // Array literal object with non-array argument
    {
      code: 'const n: number = 1; [1, 2].concat(n);',
      output: 'const n: number = 1; [1, 2, n];',
      errors: [
        {
          messageId: 'preferSpreadArray',
          line: 1,
          column: 22,
          endLine: 1,
          endColumn: 38
        }
      ]
    },

    // Array concat with array literal argument
    {
      code: 'const arr: number[] = [1, 2]; arr.concat([3, 4]);',
      output: 'const arr: number[] = [1, 2]; [...arr, 3, 4];',
      errors: [
        {
          messageId: 'preferSpreadArray',
          line: 1,
          column: 31,
          endLine: 1,
          endColumn: 49
        }
      ]
    },

    // Array concat with a union of array arguments
    {
      code: 'declare const arr: number[]; declare const x: number[] | string[]; arr.concat(x);',
      output:
        'declare const arr: number[]; declare const x: number[] | string[]; [...arr, ...x];',
      errors: [
        {
          messageId: 'preferSpreadArray',
          line: 1,
          column: 68,
          endLine: 1,
          endColumn: 81
        }
      ]
    },

    // Array concat with a typed array argument
    {
      code: 'declare const arr: number[]; declare const x: Uint8Array; arr.concat(x);',
      output:
        'declare const arr: number[]; declare const x: Uint8Array; [...arr, x];',
      errors: [
        {
          messageId: 'preferSpreadArray',
          line: 1,
          column: 59,
          endLine: 1,
          endColumn: 72
        }
      ]
    },

    // Array.from with iterables
    {
      code: 'declare const s: Set<number>; Array.from(s);',
      output: 'declare const s: Set<number>; [...s];',
      errors: [
        {
          messageId: 'preferSpreadArrayFrom',
          line: 1,
          column: 31,
          endLine: 1,
          endColumn: 44
        }
      ]
    },
    {
      code: 'declare const s: string; Array.from(s);',
      output: 'declare const s: string; [...s];',
      errors: [
        {
          messageId: 'preferSpreadArrayFrom',
          line: 1,
          column: 26,
          endLine: 1,
          endColumn: 39
        }
      ]
    },
    {
      code: 'declare const s: Iterable<number>; Array.from(s);',
      output: 'declare const s: Iterable<number>; [...s];',
      errors: [
        {
          messageId: 'preferSpreadArrayFrom',
          line: 1,
          column: 36,
          endLine: 1,
          endColumn: 49
        }
      ]
    },
    {
      code: 'function f<T extends number[]>(s: T) { Array.from(s); }',
      output: 'function f<T extends number[]>(s: T) { [...s]; }',
      errors: [
        {
          messageId: 'preferSpreadArrayFrom',
          line: 1,
          column: 40,
          endLine: 1,
          endColumn: 53
        }
      ]
    },
    {
      code: 'declare const s: any; Array.from(s);',
      output: 'declare const s: any; [...s];',
      errors: [
        {
          messageId: 'preferSpreadArrayFrom',
          line: 1,
          column: 23,
          endLine: 1,
          endColumn: 36
        }
      ]
    }
  ]
});
