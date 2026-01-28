import {RuleTester} from 'eslint';
import {preferArraySome} from './prefer-array-some.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-array-some', preferArraySome, {
  valid: [
    'if (arr.some(fn)) {}',
    'const found = arr.some(fn)',
    'if (!arr.some(fn)) {}',

    // find calls where the result is used
    'const item = arr.find(fn)',
    'const item = arr.find(x => x.id === 1)',
    'function foo() { return arr.find(fn); }',
    'obj.item = arr.find(fn)',

    // find with result used in expression
    'const item = arr.find(fn) || defaultValue',
    'const name = arr.find(fn)?.name',
    'processItem(arr.find(fn))',

    // find compared to other values
    'if (arr.find(fn) === someValue) {}',
    'if (arr.find(fn) !== someValue) {}',

    // strict equality with null
    'if (arr.find(fn) === null) {}',
    'if (arr.find(fn) !== null) {}',

    // loose equality
    'if (arr.find(fn) == undefined) {}',
    'if (arr.find(fn) != undefined) {}',
    'if (arr.find(fn) == null) {}',
    'if (arr.find(fn) != null) {}'
  ],

  invalid: [
    // !arr.find(fn) -> !arr.some(fn)
    {
      code: 'if (!arr.find(fn)) {}',
      output: 'if (!arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 18
        }
      ]
    },
    {
      code: 'if (!arr.find(x => x.id === 1)) {}',
      output: 'if (!arr.some(x => x.id === 1)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 31
        }
      ]
    },

    // !!arr.find(fn) -> arr.some(fn)
    {
      code: 'if (!!arr.find(fn)) {}',
      output: 'if (arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 19
        }
      ]
    },
    {
      code: 'const exists = !!arr.find(fn);',
      output: 'const exists = arr.some(fn);',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 16,
          endLine: 1,
          endColumn: 30
        }
      ]
    },

    // arr.find(fn) in condition -> arr.some(fn)
    {
      code: 'if (arr.find(fn)) {}',
      output: 'if (arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 17
        }
      ]
    },
    {
      code: 'while (arr.find(fn)) {}',
      output: 'while (arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 8,
          endLine: 1,
          endColumn: 20
        }
      ]
    },
    {
      code: 'for (; arr.find(fn);) {}',
      output: 'for (; arr.some(fn);) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 8,
          endLine: 1,
          endColumn: 20
        }
      ]
    },
    {
      code: 'do {} while (arr.find(fn))',
      output: 'do {} while (arr.some(fn))',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 14,
          endLine: 1,
          endColumn: 26
        }
      ]
    },
    {
      code: 'const result = arr.find(fn) ? "yes" : "no";',
      output: 'const result = arr.some(fn) ? "yes" : "no";',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 16,
          endLine: 1,
          endColumn: 28
        }
      ]
    },
    {
      code: 'if (arr.find(fn) && otherCondition) {}',
      output: 'if (arr.some(fn) && otherCondition) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 17
        }
      ]
    },
    {
      code: 'if (otherCondition || arr.find(fn)) {}',
      output: 'if (otherCondition || arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 23,
          endLine: 1,
          endColumn: 35
        }
      ]
    },

    // arr.find(fn) === undefined -> !arr.some(fn)
    {
      code: 'if (arr.find(fn) === undefined) {}',
      output: 'if (!arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 31
        }
      ]
    },
    {
      code: 'if (undefined === arr.find(fn)) {}',
      output: 'if (!arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 31
        }
      ]
    },

    // arr.find(fn) !== undefined -> arr.some(fn)
    {
      code: 'if (arr.find(fn) !== undefined) {}',
      output: 'if (arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 31
        }
      ]
    },
    {
      code: 'const exists = arr.find(fn) !== undefined;',
      output: 'const exists = arr.some(fn);',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 16,
          endLine: 1,
          endColumn: 42
        }
      ]
    },

    // void 0 (alternative to undefined)
    {
      code: 'if (arr.find(fn) === void 0) {}',
      output: 'if (!arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 28
        }
      ]
    },
    {
      code: 'if (arr.find(fn) !== void 0) {}',
      output: 'if (arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 28
        }
      ]
    },

    // member expressions and what not
    {
      code: 'if (this.items.find(fn)) {}',
      output: 'if (this.items.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 24
        }
      ]
    },
    {
      code: 'if (obj.data.arr.find(x => x.id === id)) {}',
      output: 'if (obj.data.arr.some(x => x.id === id)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 40
        }
      ]
    },
    {
      code: 'if (getArray().find(item => item.active)) {}',
      output: 'if (getArray().some(item => item.active)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 41
        }
      ]
    },

    // with thisArg parameter
    {
      code: 'if (arr.find(fn, thisArg)) {}',
      output: 'if (arr.some(fn, thisArg)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 26
        }
      ]
    }
  ]
});
