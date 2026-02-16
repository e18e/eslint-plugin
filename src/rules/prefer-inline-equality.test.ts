import {RuleTester} from 'eslint';
import {RuleTester as TSRuleTester} from '@typescript-eslint/rule-tester';
import {preferInlineEquality} from './prefer-inline-equality.js';
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

ruleTester.run(
  'prefer-inline-equality (untyped)',
  preferInlineEquality as never,
  {
    valid: [
      'arr.includes(x)',

      // empty
      '[].includes(x)',

      // too many elements
      '[a, b, c, d, e, f, g].includes(x)',

      // NaN
      '[NaN, a].includes(x)',

      // val is a call expression (side effects)
      '[a, b].includes(foo())',

      // Element is a call expression
      '[foo(), b].includes(x)',

      // Spread without types (should be skipped)
      '[...a, b].includes(x)',

      // Sparse array
      '[a, , b].includes(x)',

      // No arguments
      '[a, b].includes()',

      // Multiple arguments
      '[a, b].includes(x, 0)',

      // Computed property
      '[a, b][method](x)'
    ],
    invalid: [
      // Basic two elements
      {
        code: '[a, b].includes(x)',
        output: 'a === x || b === x',
        errors: [
          {
            messageId: 'preferEquality',
            line: 1,
            column: 1,
            endLine: 1,
            endColumn: 19
          }
        ]
      },
      // Three elements with literals
      {
        code: '[1, 2, 3].includes(x)',
        output: '1 === x || 2 === x || 3 === x',
        errors: [
          {
            messageId: 'preferEquality',
            line: 1,
            column: 1,
            endLine: 1,
            endColumn: 22
          }
        ]
      },
      // String literals
      {
        code: '["a", "b"].includes(x)',
        output: '"a" === x || "b" === x',
        errors: [
          {
            messageId: 'preferEquality',
            line: 1,
            column: 1,
            endLine: 1,
            endColumn: 23
          }
        ]
      },
      // Mixed identifiers and literals
      {
        code: '[a, 1, "b"].includes(x)',
        output: 'a === x || 1 === x || "b" === x',
        errors: [
          {
            messageId: 'preferEquality',
            line: 1,
            column: 1,
            endLine: 1,
            endColumn: 24
          }
        ]
      },
      // Negated
      {
        code: '![a, b].includes(x)',
        output: 'a !== x && b !== x',
        errors: [
          {
            messageId: 'preferEquality',
            line: 1,
            column: 1,
            endLine: 1,
            endColumn: 20
          }
        ]
      },
      // val is a member expression (safe to repeat)
      {
        code: '[a, b].includes(obj.prop)',
        output: 'a === obj.prop || b === obj.prop',
        errors: [
          {
            messageId: 'preferEquality',
            line: 1,
            column: 1,
            endLine: 1,
            endColumn: 26
          }
        ]
      },
      // Wraps in parens when used as argument
      {
        code: 'foo([a, b].includes(x))',
        output: 'foo((a === x || b === x))',
        errors: [
          {
            messageId: 'preferEquality',
            line: 1,
            column: 5,
            endLine: 1,
            endColumn: 23
          }
        ]
      },
      // Wraps in parens when used in logical expression
      {
        code: '[a, b].includes(x) && y',
        output: '(a === x || b === x) && y',
        errors: [
          {
            messageId: 'preferEquality',
            line: 1,
            column: 1,
            endLine: 1,
            endColumn: 19
          }
        ]
      },
      // Single element
      {
        code: '[a].includes(x)',
        output: 'a === x',
        errors: [
          {
            messageId: 'preferEquality',
            line: 1,
            column: 1,
            endLine: 1,
            endColumn: 16
          }
        ]
      },
      // Negated in logical expression
      {
        code: '![a, b].includes(x) && y',
        output: '(a !== x && b !== x) && y',
        errors: [
          {
            messageId: 'preferEquality',
            line: 1,
            column: 1,
            endLine: 1,
            endColumn: 20
          }
        ]
      }
    ]
  }
);

typedRuleTester.run('prefer-inline-equality (typed)', preferInlineEquality, {
  valid: [
    // Spread of non-array type (string)
    {
      code: `
        const s: string = "abc";
        [a, ...s].includes(x);
      `
    },
    // Spread of unknown iterable type
    {
      code: `
        function foo(s: Iterable<number>) {
          [...s].includes(x);
        }
      `
    }
  ],
  invalid: [
    // Spread of array type
    {
      code: `
        const arr: number[] = [1, 2, 3];
        [...arr].includes(x);
      `,
      output: `
        const arr: number[] = [1, 2, 3];
        arr.includes(x);
      `,
      errors: [
        {
          messageId: 'preferEquality',
          line: 3,
          column: 9,
          endLine: 3,
          endColumn: 29
        }
      ]
    },
    // Mixed elements and spread
    {
      code: `
        const arr: number[] = [1, 2, 3];
        [a, ...arr, b].includes(x);
      `,
      output: `
        const arr: number[] = [1, 2, 3];
        a === x || arr.includes(x) || b === x;
      `,
      errors: [
        {
          messageId: 'preferEquality',
          line: 3,
          column: 9,
          endLine: 3,
          endColumn: 35
        }
      ]
    },
    // Negated with spread
    {
      code: `
        const arr: number[] = [1, 2, 3];
        ![a, ...arr].includes(x);
      `,
      output: `
        const arr: number[] = [1, 2, 3];
        a !== x && !arr.includes(x);
      `,
      errors: [
        {
          messageId: 'preferEquality',
          line: 3,
          column: 9,
          endLine: 3,
          endColumn: 33
        }
      ]
    },
    // Spread of Set type
    {
      code: `
        const s = new Set([1, 2, 3]);
        [...s].includes(x);
      `,
      output: `
        const s = new Set([1, 2, 3]);
        s.has(x);
      `,
      errors: [
        {
          messageId: 'preferEquality',
          line: 3,
          column: 9,
          endLine: 3,
          endColumn: 27
        }
      ]
    },
    // Mixed elements and Set spread
    {
      code: `
        const s = new Set([1, 2, 3]);
        [a, ...s].includes(x);
      `,
      output: `
        const s = new Set([1, 2, 3]);
        a === x || s.has(x);
      `,
      errors: [
        {
          messageId: 'preferEquality',
          line: 3,
          column: 9,
          endLine: 3,
          endColumn: 30
        }
      ]
    },
    // Negated Set spread
    {
      code: `
        const s = new Set([1, 2, 3]);
        ![...s].includes(x);
      `,
      output: `
        const s = new Set([1, 2, 3]);
        !s.has(x);
      `,
      errors: [
        {
          messageId: 'preferEquality',
          line: 3,
          column: 9,
          endLine: 3,
          endColumn: 28
        }
      ]
    },
    // Basic case still works with types
    {
      code: `
        [a, b].includes(x);
      `,
      output: `
        a === x || b === x;
      `,
      errors: [
        {
          messageId: 'preferEquality',
          line: 2,
          column: 9,
          endLine: 2,
          endColumn: 27
        }
      ]
    }
  ]
});
