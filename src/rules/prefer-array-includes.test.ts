import {RuleTester} from 'eslint';
import {preferArrayIncludes} from './prefer-array-includes.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-array-includes', preferArrayIncludes, {
  valid: [
    // Already using .includes()
    'if (arr.includes(item)) {}',
    'const found = arr.includes(item)',
    'if (!arr.includes(item)) {}',

    // Plain indexOf calls (not being compared)
    'const index = arr.indexOf(item)',
    'arr.indexOf(item)',

    // indexOf compared to other values
    'if (arr.indexOf(item) === 0) {}',
    'if (arr.indexOf(item) === 1) {}',
    'if (arr.indexOf(item) > 0) {}',
    'if (arr.indexOf(item) < 1) {}',

    // Other comparisons with -1
    'if (x === -1) {}',
    'if (-1 === y) {}'
  ],

  invalid: [
    // Basic !== -1 pattern
    {
      code: 'if (arr.indexOf(item) !== -1) {}',
      output: 'if (arr.includes(item)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },

    // Basic != -1 pattern
    {
      code: 'if (arr.indexOf(item) != -1) {}',
      output: 'if (arr.includes(item)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },

    // Basic > -1 pattern
    {
      code: 'if (arr.indexOf(item) > -1) {}',
      output: 'if (arr.includes(item)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },

    // Basic >= 0 pattern
    {
      code: 'if (arr.indexOf(item) >= 0) {}',
      output: 'if (arr.includes(item)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },

    // Reversed positive comparisons
    {
      code: 'if (-1 !== arr.indexOf(item)) {}',
      output: 'if (arr.includes(item)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },
    {
      code: 'if (-1 != myArray.indexOf(value)) {}',
      output: 'if (myArray.includes(value)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },
    {
      code: 'if (-1 < myArray.indexOf(value)) {}',
      output: 'if (myArray.includes(value)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },
    {
      code: 'if (0 <= items.indexOf(x)) {}',
      output: 'if (items.includes(x)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },

    // Negative patterns (=== -1)
    {
      code: 'if (arr.indexOf(item) === -1) {}',
      output: 'if (!arr.includes(item)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },
    {
      code: 'if (arr.indexOf(item) == -1) {}',
      output: 'if (!arr.includes(item)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },
    {
      code: 'if (arr.indexOf(item) < 0) {}',
      output: 'if (!arr.includes(item)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },

    // Reversed negative comparisons
    {
      code: 'if (-1 === arr.indexOf(item)) {}',
      output: 'if (!arr.includes(item)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },
    {
      code: 'if (-1 == arr.indexOf(item)) {}',
      output: 'if (!arr.includes(item)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },
    {
      code: 'if (0 > myArray.indexOf(value)) {}',
      output: 'if (!myArray.includes(value)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },

    // Bitwise NOT operator (~)
    {
      code: 'if (~arr.indexOf(item)) {}',
      output: 'if (arr.includes(item)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },
    {
      code: 'const hasValue = ~items.indexOf(value);',
      output: 'const hasValue = items.includes(value);',
      errors: [{messageId: 'preferIncludes', line: 1, column: 18}]
    },

    // Negated bitwise NOT (!~)
    {
      code: 'if (!~arr.indexOf(item)) {}',
      output: 'if (!arr.includes(item)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },
    {
      code: 'const missingValue = !~items.indexOf(value);',
      output: 'const missingValue = !items.includes(value);',
      errors: [{messageId: 'preferIncludes', line: 1, column: 22}]
    },

    // Variable declarations
    {
      code: 'const hasItem = arr.indexOf(item) !== -1;',
      output: 'const hasItem = arr.includes(item);',
      errors: [{messageId: 'preferIncludes', line: 1, column: 17}]
    },
    {
      code: 'const missingItem = arr.indexOf(other) === -1;',
      output: 'const missingItem = !arr.includes(other);',
      errors: [{messageId: 'preferIncludes', line: 1, column: 21}]
    },

    // Multiple patterns in one file
    {
      code: `const hasItem = arr.indexOf(item) !== -1;
const missingItem = arr.indexOf(other) === -1;
if (list.indexOf(value) > -1) {
  doSomething();
}
if (-1 === items.indexOf(x)) {
  handleMissing();
}`,
      output: `const hasItem = arr.includes(item);
const missingItem = !arr.includes(other);
if (list.includes(value)) {
  doSomething();
}
if (!items.includes(x)) {
  handleMissing();
}`,
      errors: [
        {messageId: 'preferIncludes', line: 1, column: 17},
        {messageId: 'preferIncludes', line: 2, column: 21},
        {messageId: 'preferIncludes', line: 3, column: 5},
        {messageId: 'preferIncludes', line: 6, column: 5}
      ]
    },

    // Complex array expressions
    {
      code: 'if (this.items.indexOf(item) !== -1) {}',
      output: 'if (this.items.includes(item)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },
    {
      code: 'if (obj.data.arr.indexOf(x) >= 0) {}',
      output: 'if (obj.data.arr.includes(x)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },
    {
      code: 'if (getArray().indexOf(item) !== -1) {}',
      output: 'if (getArray().includes(item)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },

    // In logical expressions
    {
      code: 'if (arr.indexOf(x) !== -1 && arr.indexOf(y) !== -1) {}',
      output: 'if (arr.includes(x) && arr.includes(y)) {}',
      errors: [
        {messageId: 'preferIncludes', line: 1, column: 5},
        {messageId: 'preferIncludes', line: 1, column: 30}
      ]
    },
    {
      code: 'if (arr.indexOf(x) === -1 || arr.indexOf(y) === -1) {}',
      output: 'if (!arr.includes(x) || !arr.includes(y)) {}',
      errors: [
        {messageId: 'preferIncludes', line: 1, column: 5},
        {messageId: 'preferIncludes', line: 1, column: 30}
      ]
    },

    // As return values
    {
      code: 'function check() { return arr.indexOf(item) !== -1; }',
      output: 'function check() { return arr.includes(item); }',
      errors: [{messageId: 'preferIncludes', line: 1, column: 27}]
    },
    {
      code: 'function check() { return arr.indexOf(item) === -1; }',
      output: 'function check() { return !arr.includes(item); }',
      errors: [{messageId: 'preferIncludes', line: 1, column: 27}]
    },

    // Ternary expressions
    {
      code: 'const result = arr.indexOf(item) !== -1 ? "found" : "not found";',
      output: 'const result = arr.includes(item) ? "found" : "not found";',
      errors: [{messageId: 'preferIncludes', line: 1, column: 16}]
    },

    // With second parameter (fromIndex)
    {
      code: 'if (arr.indexOf(item, 2) !== -1) {}',
      output: 'if (arr.includes(item, 2)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    },
    {
      code: 'if (arr.indexOf(item, start) >= 0) {}',
      output: 'if (arr.includes(item, start)) {}',
      errors: [{messageId: 'preferIncludes', line: 1, column: 5}]
    }
  ]
});
