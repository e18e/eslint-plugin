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
    'if (arr.find(fn) != null) {}',

    // --- filter().length cases that should NOT be flagged ---

    // result used as a number, not a boolean existence check
    'const count = arr.filter(fn).length',
    'console.log(arr.filter(fn).length)',
    'function foo() { return arr.filter(fn).length }',
    'const n = arr.filter(fn).length + 1',
    'Math.max(arr.filter(fn).length, 1)',

    // quantity comparisons (not "does any exist?")
    'if (arr.filter(fn).length > 1) {}',
    'if (arr.filter(fn).length >= 2) {}',
    'if (arr.filter(fn).length === 3) {}',
    'if (arr.filter(fn).length !== 1) {}',
    'if (arr.filter(fn).length < 3) {}',
    'if (arr.filter(fn).length <= 2) {}',
    'if (2 > arr.filter(fn).length) {}',
    'if (3 === arr.filter(fn).length) {}',

    // filter() with no arguments — .some() would throw a TypeError
    'if (arr.filter().length > 0) {}',
    'if (arr.filter().length) {}',

    // always-true / always-false logic bugs — don't suggest some(), these are broken
    'if (arr.filter(fn).length >= 0) {}',
    'if (arr.filter(fn).length > -1) {}',
    'if (arr.filter(fn).length < 0) {}',
    'if (0 > arr.filter(fn).length) {}',

    // loose equality — only strict === / !== are flagged
    'if (arr.filter(fn).length == 0) {}',
    'if (arr.filter(fn).length != 0) {}'
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
    },

    // --- filter().length cases ---

    // filter().length > 0 -> arr.some(fn)
    {
      code: 'if (arr.filter(fn).length > 0) {}',
      output: 'if (arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 30
        }
      ]
    },
    {
      code: 'if (arr.filter(x => x.active).length > 0) {}',
      output: 'if (arr.some(x => x.active)) {}',
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

    // filter().length !== 0 -> arr.some(fn)
    {
      code: 'if (arr.filter(fn).length !== 0) {}',
      output: 'if (arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 32
        }
      ]
    },

    // filter().length >= 1 -> arr.some(fn)
    {
      code: 'if (arr.filter(fn).length >= 1) {}',
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

    // filter().length === 0 -> !arr.some(fn)
    {
      code: 'if (arr.filter(fn).length === 0) {}',
      output: 'if (!arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 32
        }
      ]
    },

    // filter().length < 1 -> !arr.some(fn)
    {
      code: 'if (arr.filter(fn).length < 1) {}',
      output: 'if (!arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 30
        }
      ]
    },

    // flipped operands: 0 < filter().length -> arr.some(fn)
    {
      code: 'if (0 < arr.filter(fn).length) {}',
      output: 'if (arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 30
        }
      ]
    },
    {
      code: 'if (0 !== arr.filter(fn).length) {}',
      output: 'if (arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 32
        }
      ]
    },
    {
      code: 'if (1 <= arr.filter(fn).length) {}',
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
      code: 'if (0 === arr.filter(fn).length) {}',
      output: 'if (!arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 32
        }
      ]
    },
    {
      code: 'if (1 > arr.filter(fn).length) {}',
      output: 'if (!arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 30
        }
      ]
    },

    // filter().length in boolean context (truthy)
    {
      code: 'if (arr.filter(fn).length) {}',
      output: 'if (arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 26
        }
      ]
    },
    {
      code: 'while (arr.filter(fn).length) {}',
      output: 'while (arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 8,
          endLine: 1,
          endColumn: 29
        }
      ]
    },
    {
      code: 'const result = arr.filter(fn).length ? "yes" : "no";',
      output: 'const result = arr.some(fn) ? "yes" : "no";',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 16,
          endLine: 1,
          endColumn: 37
        }
      ]
    },

    // !filter().length -> !arr.some(fn)
    {
      code: 'if (!arr.filter(fn).length) {}',
      output: 'if (!arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 27
        }
      ]
    },

    // !!filter().length -> arr.some(fn)
    {
      code: 'if (!!arr.filter(fn).length) {}',
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
    {
      code: 'const exists = !!arr.filter(fn).length;',
      output: 'const exists = arr.some(fn);',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 16,
          endLine: 1,
          endColumn: 39
        }
      ]
    },

    // with thisArg
    {
      code: 'if (arr.filter(fn, thisArg).length > 0) {}',
      output: 'if (arr.some(fn, thisArg)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 39
        }
      ]
    },

    // member expression / chained object access
    {
      code: 'if (this.items.filter(fn).length > 0) {}',
      output: 'if (this.items.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 37
        }
      ]
    },
    {
      code: 'if (obj.data.arr.filter(x => x.id === id).length > 0) {}',
      output: 'if (obj.data.arr.some(x => x.id === id)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 53
        }
      ]
    },
    {
      code: 'if (getArray().filter(item => item.active).length > 0) {}',
      output: 'if (getArray().some(item => item.active)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 54
        }
      ]
    },

    // bracket notation for .length
    {
      code: 'if (arr.filter(fn)["length"] > 0) {}',
      output: 'if (arr.some(fn)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 33
        }
      ]
    },

    // used in logical expression
    {
      code: 'if (arr.filter(fn).length > 0 && otherCondition) {}',
      output: 'if (arr.some(fn) && otherCondition) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 30
        }
      ]
    },

    // assignment context (exists as boolean)
    {
      code: 'const exists = arr.filter(fn).length > 0;',
      output: 'const exists = arr.some(fn);',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 16,
          endLine: 1,
          endColumn: 41
        }
      ]
    },

    // chained filter — fixes the outer .filter().length, leaves inner .filter() in place;
    // arr.filter(fn1).some(fn2) is correct, just not maximally optimal
    {
      code: 'if (arr.filter(fn1).filter(fn2).length > 0) {}',
      output: 'if (arr.filter(fn1).some(fn2)) {}',
      errors: [
        {
          messageId: 'preferArraySome',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 43
        }
      ]
    }
  ]
});
