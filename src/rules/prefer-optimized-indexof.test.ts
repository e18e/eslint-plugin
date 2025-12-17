import {RuleTester} from 'eslint';
import {preferOptimizedIndexof} from './prefer-optimized-indexof.js';
import * as tseslint from 'typescript-eslint';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parser: tseslint.parser,
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts']
      }
    }
  }
});

ruleTester.run('prefer-optimized-indexof', preferOptimizedIndexof, {
  valid: [
    // checking if an item does NOT exist
    {
      code: `
        const arr: number[] = [1, 2, 3];
        if (arr.indexOf(1) === -1) {}
      `
    },
    {
      code: `
        const str: string = "hello";
        if (str.indexOf("x") === -1) {}
      `
    },

    // checking something other than equality
    {
      code: `
        const str: string = "hello";
        if (str.indexOf("h") !== 0) {}
      `
    },
    {
      code: `
        const arr: number[] = [1, 2, 3];
        if (arr.indexOf(2) > 0) {}
      `
    },
    {
      code: `
        const arr: number[] = [1, 2, 3];
        if (arr.indexOf(0) < 0) {}
      `
    },

    // not part of a comparison
    {
      code: `
        const arr: number[] = [1, 2, 3];
        arr.indexOf(2);
      `
    },
    {
      code: `
        const arr: number[] = [1, 2, 3];
        const idx = arr.indexOf(2);
      `
    },

    // not indexOf method
    {
      code: `
        const arr: number[] = [1, 2, 3];
        const item = 2;
        if (arr.findIndex(x => x === item) === 0) {}
      `
    },

    // indexOf with fromIndex parameter
    {
      code: `
        const arr: number[] = [1, 2, 3];
        if (arr.indexOf(2, 1) === 0) {}
      `
    },
    {
      code: `
        const str: string = "hello";
        if (str.indexOf("l", 5) === 0) {}
      `
    },

    // comparing against a variable
    {
      code: `
        const arr: number[] = [1, 2, 3];
        const index = 1;
        if (arr.indexOf(2) === index) {}
      `
    },
    {
      code: `
        const str: string = "hello";
        const someVar = 0;
        if (str.indexOf("h") === someVar) {}
      `
    },

    // string indexOf to a non-zero index
    {
      code: `
        const str: string = "hello";
        if (str.indexOf("l") === 2) {}
      `
    }
  ],

  invalid: [
    // common string cases
    {
      code: `
        const str: string = "hello";
        if (str.indexOf("h") === 0) {}
      `,
      output: `
        const str: string = "hello";
        if (str.startsWith("h")) {}
      `,
      errors: [{messageId: 'preferStartsWith', line: 3, column: 13}]
    },
    {
      code: `
        const str: string = "hello";
        if (str.indexOf("h") == 0) {}
      `,
      output: `
        const str: string = "hello";
        if (str.startsWith("h")) {}
      `,
      errors: [{messageId: 'preferStartsWith', line: 3, column: 13}]
    },
    {
      code: `
        const str: string = "hello";
        if (0 === str.indexOf("h")) {}
      `,
      output: `
        const str: string = "hello";
        if (str.startsWith("h")) {}
      `,
      errors: [{messageId: 'preferStartsWith', line: 3, column: 13}]
    },
    {
      code: `
        function check(str: string, sub: string) {
          return str.indexOf(sub) === 0;
        }
      `,
      output: `
        function check(str: string, sub: string) {
          return str.startsWith(sub);
        }
      `,
      errors: [{messageId: 'preferStartsWith', line: 3, column: 18}]
    },

    // common array cases
    {
      code: `
        const arr: number[] = [1, 2, 3];
        if (arr.indexOf(1) === 0) {}
      `,
      output: `
        const arr: number[] = [1, 2, 3];
        if (arr[0] === 1) {}
      `,
      errors: [
        {
          messageId: 'preferDirectAccess',
          data: {array: 'arr', item: '1', index: '0'},
          line: 3,
          column: 13
        }
      ]
    },
    {
      code: `
        const arr: string[] = ["a", "b"];
        if (arr.indexOf("a") == 0) {}
      `,
      output: `
        const arr: string[] = ["a", "b"];
        if (arr[0] === "a") {}
      `,
      errors: [
        {
          messageId: 'preferDirectAccess',
          data: {array: 'arr', item: '"a"', index: '0'},
          line: 3,
          column: 13
        }
      ]
    },
    {
      code: `
        const arr: number[] = [1, 2, 3];
        if (0 === arr.indexOf(1)) {}
      `,
      output: `
        const arr: number[] = [1, 2, 3];
        if (arr[0] === 1) {}
      `,
      errors: [
        {
          messageId: 'preferDirectAccess',
          data: {array: 'arr', item: '1', index: '0'},
          line: 3,
          column: 13
        }
      ]
    },
    {
      code: `
        function check(arr: Array<string>, item: string) {
          return arr.indexOf(item) === 0;
        }
      `,
      output: `
        function check(arr: Array<string>, item: string) {
          return arr[0] === item;
        }
      `,
      errors: [
        {
          messageId: 'preferDirectAccess',
          data: {array: 'arr', item: 'item', index: '0'},
          line: 3,
          column: 18
        }
      ]
    },

    // arrays with positive index comparison
    {
      code: `
        const arr: number[] = [1, 2, 3];
        if (arr.indexOf(2) === 1) {}
      `,
      output: `
        const arr: number[] = [1, 2, 3];
        if (arr[1] === 2) {}
      `,
      errors: [
        {
          messageId: 'preferDirectAccess',
          data: {array: 'arr', item: '2', index: '1'},
          line: 3,
          column: 13
        }
      ]
    },
    {
      code: `
        const arr: number[] = [1, 2, 3, 4, 5];
        if (arr.indexOf(4) === 3) {}
      `,
      output: `
        const arr: number[] = [1, 2, 3, 4, 5];
        if (arr[3] === 4) {}
      `,
      errors: [
        {
          messageId: 'preferDirectAccess',
          data: {array: 'arr', item: '4', index: '3'},
          line: 3,
          column: 13
        }
      ]
    },
    {
      code: `
        const items: string[] = ["a", "b", "c"];
        const found = 2 === items.indexOf("c");
      `,
      output: `
        const items: string[] = ["a", "b", "c"];
        const found = items[2] === "c";
      `,
      errors: [
        {
          messageId: 'preferDirectAccess',
          data: {array: 'items', item: '"c"', index: '2'},
          line: 3,
          column: 23
        }
      ]
    },

    // using member expressions
    {
      code: `
        const obj: {items: string[]} = {items: []};
        if (obj.items.indexOf("test") === 0) {}
      `,
      output: `
        const obj: {items: string[]} = {items: []};
        if (obj.items[0] === "test") {}
      `,
      errors: [
        {
          messageId: 'preferDirectAccess',
          data: {array: 'obj.items', item: '"test"', index: '0'},
          line: 3,
          column: 13
        }
      ]
    },
    {
      code: `
        const obj: {items: string[]} = {items: ['a', 'b', 'c']};
        if (obj.items.indexOf("c") === 2) {}
      `,
      output: `
        const obj: {items: string[]} = {items: ['a', 'b', 'c']};
        if (obj.items[2] === "c") {}
      `,
      errors: [
        {
          messageId: 'preferDirectAccess',
          data: {array: 'obj.items', item: '"c"', index: '2'},
          line: 3,
          column: 13
        }
      ]
    },
    {
      code: `
        function getName(): string {
          return "test";
        }
        if (getName().indexOf("t") === 0) {}
      `,
      output: `
        function getName(): string {
          return "test";
        }
        if (getName().startsWith("t")) {}
      `,
      errors: [{messageId: 'preferStartsWith', line: 5, column: 13}]
    }
  ]
});
