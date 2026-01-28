import {RuleTester} from 'eslint';
import {RuleTester as TSRuleTester} from '@typescript-eslint/rule-tester';
import {preferArrayAt} from './prefer-array-at.js';
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

ruleTester.run('prefer-array-at (untyped)', preferArrayAt as never, {
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
          data: {array: 'myArray'},
          line: 1,
          column: 14,
          endLine: 1,
          endColumn: 41
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
          data: {array: 'arr'},
          line: 1,
          column: 14,
          endLine: 1,
          endColumn: 33
        }
      ]
    },
    {
      code: 'const last = items[items.length - 1]',
      output: 'const last = items.at(-1)',
      errors: [
        {
          messageId: 'preferAt',
          data: {array: 'items'},
          line: 1,
          column: 14,
          endLine: 1,
          endColumn: 37
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
          data: {array: 'arr1'},
          line: 1,
          column: 15,
          endLine: 1,
          endColumn: 36
        },
        {
          messageId: 'preferAt',
          data: {array: 'arr2'},
          line: 2,
          column: 15,
          endLine: 2,
          endColumn: 36
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
          data: {array: 'myArray'},
          line: 1,
          column: 13,
          endLine: 1,
          endColumn: 40
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
          data: {array: 'arr'},
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 24
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
          data: {array: 'items'},
          line: 1,
          column: 34,
          endLine: 1,
          endColumn: 57
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
          data: {array: 'this.items'},
          line: 1,
          column: 14,
          endLine: 1,
          endColumn: 47
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
          data: {array: 'getArray()'},
          line: 1,
          column: 14,
          endLine: 1,
          endColumn: 47
        }
      ]
    }
  ]
});

typedRuleTester.run('prefer-array-at (typed)', preferArrayAt, {
  valid: [
    // NodeList does not have .at() method
    {
      code: `
        declare const nodes: NodeList;
        const last = nodes[nodes.length - 1];
      `
    },
    // HTMLCollection does not have .at() method
    {
      code: `
        declare const elements: HTMLCollection;
        const last = elements[elements.length - 1];
      `
    },
    // Custom object with length property
    {
      code: `
        interface CustomList {
          length: number;
          [index: number]: string;
        }
        declare const list: CustomList;
        const last = list[list.length - 1];
      `
    }
  ],

  invalid: [
    // Typed array variable
    {
      code: `
        const arr: number[] = [1, 2, 3];
        const last = arr[arr.length - 1];
      `,
      output: `
        const arr: number[] = [1, 2, 3];
        const last = arr.at(-1);
      `,
      errors: [
        {
          messageId: 'preferAt',
          line: 3,
          column: 22,
          endLine: 3,
          endColumn: 41
        }
      ]
    },
    // Array generic type
    {
      code: `
        const arr: Array<string> = ['a', 'b'];
        const last = arr[arr.length - 1];
      `,
      output: `
        const arr: Array<string> = ['a', 'b'];
        const last = arr.at(-1);
      `,
      errors: [
        {
          messageId: 'preferAt',
          line: 3,
          column: 22,
          endLine: 3,
          endColumn: 41
        }
      ]
    },
    // Tuple type
    {
      code: `
        const tuple: [number, string, boolean] = [1, 'a', true];
        const last = tuple[tuple.length - 1];
      `,
      output: `
        const tuple: [number, string, boolean] = [1, 'a', true];
        const last = tuple.at(-1);
      `,
      errors: [
        {
          messageId: 'preferAt',
          line: 3,
          column: 22,
          endLine: 3,
          endColumn: 45
        }
      ]
    },
    // Typed array (Int32Array, etc.)
    {
      code: `
        const typedArr: Int32Array = new Int32Array(10);
        const last = typedArr[typedArr.length - 1];
      `,
      output: `
        const typedArr: Int32Array = new Int32Array(10);
        const last = typedArr.at(-1);
      `,
      errors: [
        {
          messageId: 'preferAt',
          line: 3,
          column: 22,
          endLine: 3,
          endColumn: 51
        }
      ]
    },
    // Function returning array
    {
      code: `
        function getItems(): string[] {
          return ['a', 'b', 'c'];
        }
        const last = getItems()[getItems().length - 1];
      `,
      output: `
        function getItems(): string[] {
          return ['a', 'b', 'c'];
        }
        const last = getItems().at(-1);
      `,
      errors: [
        {
          messageId: 'preferAt',
          line: 5,
          column: 22,
          endLine: 5,
          endColumn: 55
        }
      ]
    },
    // String type
    {
      code: `
        declare const str: string;
        const last = str[str.length - 1];
      `,
      output: `
        declare const str: string;
        const last = str.at(-1);
      `,
      errors: [
        {
          messageId: 'preferAt',
          line: 3,
          column: 22,
          endLine: 3,
          endColumn: 41
        }
      ]
    },
    // String literal type
    {
      code: `
        declare const str: "foo";
        const last = str[str.length - 1];
      `,
      output: `
        declare const str: "foo";
        const last = str.at(-1);
      `,
      errors: [
        {
          messageId: 'preferAt',
          line: 3,
          column: 22,
          endLine: 3,
          endColumn: 41
        }
      ]
    }
  ]
});
