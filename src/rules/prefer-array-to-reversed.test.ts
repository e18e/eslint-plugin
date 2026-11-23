import {RuleTester} from 'eslint';
import {RuleTester as TSRuleTester} from '@typescript-eslint/rule-tester';
import {preferArrayToReversed} from './prefer-array-to-reversed.js';
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
const tsSyntaxRuleTester = new TSRuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  }
});

ruleTester.run(
  'prefer-array-to-reversed (untyped)',
  preferArrayToReversed as never,
  {
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
      'const mapped = arr.map(x => x * 2).reverse();',

      // spreading non-array iterables
      'const reversed = [...new Set([1, 2, 3])].reverse();',
      'const reversed = [...new Set(arr)].reverse();',
      'const reversed = [...new Map()].reverse();',
      'const seen = new Set(); const reversed = [...seen].reverse();',
      'let seen = new Set(); const reversed = [...seen].reverse();',
      'const entries = new Map(); const reversed = [...entries].reverse();',
      'const reversed = [...items.entries()].reverse();',
      'const reversed = [...items.keys()].reverse();',
      'const reversed = [...items.values()].reverse();'
    ],

    invalid: [
      // concat().reverse()
      {
        code: 'const reversed = arr.concat().reverse();',
        output: 'const reversed = arr.toReversed();',
        errors: [
          {
            messageId: 'preferToReversed',
            data: {array: 'arr'},
            line: 1,
            column: 18
          }
        ]
      },

      // slice().reverse()
      {
        code: 'const reversed = arr.slice().reverse();',
        output: 'const reversed = arr.toReversed();',
        errors: [
          {
            messageId: 'preferToReversed',
            data: {array: 'arr'},
            line: 1,
            column: 18
          }
        ]
      },

      // slice(0).reverse()
      {
        code: 'const reversed = arr.slice(0).reverse();',
        output: 'const reversed = arr.toReversed();',
        errors: [
          {
            messageId: 'preferToReversed',
            data: {array: 'arr'},
            line: 1,
            column: 18
          }
        ]
      },

      // [...array].reverse()
      {
        code: 'const reversed = [...arr].reverse();',
        output: 'const reversed = arr.toReversed();',
        errors: [
          {
            messageId: 'preferToReversed',
            data: {array: 'arr'},
            line: 1,
            column: 18
          }
        ]
      },

      // Member expressions
      {
        code: 'const reversed = obj.arr.concat().reverse();',
        output: 'const reversed = obj.arr.toReversed();',
        errors: [
          {
            messageId: 'preferToReversed',
            data: {array: 'obj.arr'},
            line: 1,
            column: 18
          }
        ]
      },

      // Member expressions with slice
      {
        code: 'const reversed = obj.arr.slice().reverse();',
        output: 'const reversed = obj.arr.toReversed();',
        errors: [
          {
            messageId: 'preferToReversed',
            data: {array: 'obj.arr'},
            line: 1,
            column: 18
          }
        ]
      },

      // Member expressions with spread
      {
        code: 'const reversed = [...obj.arr].reverse();',
        output: 'const reversed = obj.arr.toReversed();',
        errors: [
          {
            messageId: 'preferToReversed',
            data: {array: 'obj.arr'},
            line: 1,
            column: 18
          }
        ]
      },

      // Without assignment
      {
        code: 'arr.concat().reverse();',
        output: 'arr.toReversed();',
        errors: [
          {
            messageId: 'preferToReversed',
            data: {array: 'arr'},
            line: 1,
            column: 1
          }
        ]
      },

      // Nested in expressions
      {
        code: 'console.log(arr.slice().reverse());',
        output: 'console.log(arr.toReversed());',
        errors: [
          {
            messageId: 'preferToReversed',
            data: {array: 'arr'},
            line: 1,
            column: 13
          }
        ]
      },

      // Complex expressions
      {
        code: 'const result = someFunc().slice(0).reverse();',
        output: 'const result = someFunc().toReversed();',
        errors: [
          {
            messageId: 'preferToReversed',
            data: {array: 'someFunc()'},
            line: 1,
            column: 16
          }
        ]
      },

      // Expressions needing parentheses for property access
      {
        code: 'const reversed = [...a ?? b].reverse();',
        output: 'const reversed = (a ?? b).toReversed();',
        errors: [{messageId: 'preferToReversed', data: {array: 'a ?? b'}}]
      },
      {
        code: 'const reversed = [...a || b].reverse();',
        output: 'const reversed = (a || b).toReversed();',
        errors: [{messageId: 'preferToReversed', data: {array: 'a || b'}}]
      },
      {
        code: 'const reversed = [...a ? b : c].reverse();',
        output: 'const reversed = (a ? b : c).toReversed();',
        errors: [{messageId: 'preferToReversed', data: {array: 'a ? b : c'}}]
      },

      // Optional chaining preservation
      {
        code: 'const reversed = obj.arr?.slice().reverse();',
        output: 'const reversed = obj.arr?.toReversed();',
        errors: [{messageId: 'preferToReversed', data: {array: 'obj.arr'}}]
      },
      {
        code: 'const reversed = obj.arr?.concat().reverse();',
        output: 'const reversed = obj.arr?.toReversed();',
        errors: [{messageId: 'preferToReversed', data: {array: 'obj.arr'}}]
      },

      // Object.entries() returns an array
      {
        code: 'const reversed = [...Object.entries(obj)].reverse();',
        output: 'const reversed = Object.entries(obj).toReversed();',
        errors: [
          {
            messageId: 'preferToReversed',
            data: {array: 'Object.entries(obj)'}
          }
        ]
      }
    ]
  }
);

tsSyntaxRuleTester.run(
  'prefer-array-to-reversed (typescript syntax)',
  preferArrayToReversed,
  {
    valid: [
      'function reverseItems<T>(items: Iterable<T>) { return [...items].reverse(); }',
      'function reverseItems(items: Map<string, number>) { return [...items.entries()].reverse(); }',
      'const items: Set<string> = new Set(); const reversed = [...items].reverse();',
      'let items: Iterable<string>; const reversed = [...items].reverse();'
    ],
    invalid: [
      {
        code: 'const items: string[] = []; const reversed = [...items].reverse();',
        output:
          'const items: string[] = []; const reversed = items.toReversed();',
        errors: [{messageId: 'preferToReversed'}]
      }
    ]
  }
);

typedRuleTester.run('prefer-array-to-reversed (typed)', preferArrayToReversed, {
  valid: [
    // Set spread - Set doesn't have toReversed()
    {
      code: `
        declare const mySet: Set<number>;
        const reversed = [...mySet].reverse();
      `
    },
    // Map spread - Map doesn't have toReversed()
    {
      code: `
        declare const myMap: Map<string, number>;
        const reversed = [...myMap].reverse();
      `
    },
    // Iterable spread - generic iterables don't have toReversed()
    {
      code: `
        declare const iter: Iterable<number>;
        const reversed = [...iter].reverse();
      `
    }
  ],

  invalid: [
    // Typed array variable - spread
    {
      code: `
        const arr: number[] = [1, 2, 3];
        const reversed = [...arr].reverse();
      `,
      output: `
        const arr: number[] = [1, 2, 3];
        const reversed = arr.toReversed();
      `,
      errors: [
        {
          messageId: 'preferToReversed' as const,
          line: 3,
          column: 26
        }
      ]
    },
    // Tuple type - concat
    {
      code: `
        const tuple: [number, string] = [1, 'a'];
        const reversed = tuple.concat().reverse();
      `,
      output: `
        const tuple: [number, string] = [1, 'a'];
        const reversed = tuple.toReversed();
      `,
      errors: [
        {
          messageId: 'preferToReversed' as const,
          line: 3,
          column: 26
        }
      ]
    },
    // Function returning array
    {
      code: `
        function getItems(): string[] {
          return ['a', 'b', 'c'];
        }
        const reversed = [...getItems()].reverse();
      `,
      output: `
        function getItems(): string[] {
          return ['a', 'b', 'c'];
        }
        const reversed = getItems().toReversed();
      `,
      errors: [
        {
          messageId: 'preferToReversed' as const,
          line: 5,
          column: 26
        }
      ]
    }
  ]
});
