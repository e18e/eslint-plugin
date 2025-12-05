import {RuleTester} from 'eslint';
import {preferNullishCoalescing} from './prefer-nullish-coalescing.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-nullish-coalescing', preferNullishCoalescing, {
  valid: [
    // Already using nullish coalescing
    'const result = value ?? defaultValue;',
    'x ??= 5;',

    // Only checking for null (not undefined) - cannot safely transform
    'const result = value !== null ? value : defaultValue;',
    'const result = value === null ? defaultValue : value;',

    // Only checking for undefined (not null) - cannot safely transform
    'const result = value !== undefined ? value : defaultValue;',
    'const result = value === undefined ? defaultValue : value;',

    // Different values in condition and branches
    'const result = x !== null && x !== undefined ? y : z;',

    // If statements with else clause
    'if (x === null || x === undefined) { x = 5 } else { x = 10 }'
  ],

  invalid: [
    // Ternary: value !== null && value !== undefined
    {
      code: 'const result = value !== null && value !== undefined ? value : defaultValue;',
      output: 'const result = value ?? defaultValue;',
      errors: [
        {
          messageId: 'preferNullishCoalescing',
          line: 1,
          column: 16
        }
      ]
    },

    // Ternary: value !== undefined && value !== null (reversed order)
    {
      code: 'const result = value !== undefined && value !== null ? value : defaultValue;',
      output: 'const result = value ?? defaultValue;',
      errors: [
        {
          messageId: 'preferNullishCoalescing',
          line: 1,
          column: 16
        }
      ]
    },

    // Ternary: value === null || value === undefined
    {
      code: 'const result = value === null || value === undefined ? defaultValue : value;',
      output: 'const result = value ?? defaultValue;',
      errors: [
        {
          messageId: 'preferNullishCoalescing',
          line: 1,
          column: 16
        }
      ]
    },

    // Ternary: value === undefined || value === null (reversed order)
    {
      code: 'const result = value === undefined || value === null ? defaultValue : value;',
      output: 'const result = value ?? defaultValue;',
      errors: [
        {
          messageId: 'preferNullishCoalescing',
          line: 1,
          column: 16
        }
      ]
    },

    // Ternary: loose != null
    {
      code: 'const result = value != null ? value : defaultValue;',
      output: 'const result = value ?? defaultValue;',
      errors: [
        {
          messageId: 'preferNullishCoalescing',
          line: 1,
          column: 16
        }
      ]
    },

    // Ternary: loose == null
    {
      code: 'const result = value == null ? defaultValue : value;',
      output: 'const result = value ?? defaultValue;',
      errors: [
        {
          messageId: 'preferNullishCoalescing',
          line: 1,
          column: 16
        }
      ]
    },

    // Complex expression: member access
    {
      code: 'const name = user.name !== null && user.name !== undefined ? user.name : "Anonymous";',
      output: 'const name = user.name ?? "Anonymous";',
      errors: [
        {
          messageId: 'preferNullishCoalescing',
          line: 1,
          column: 14
        }
      ]
    },

    // Complex expression: with loose equality
    {
      code: 'const count = obj.prop != null ? obj.prop : 0;',
      output: 'const count = obj.prop ?? 0;',
      errors: [
        {
          messageId: 'preferNullishCoalescing',
          line: 1,
          column: 15
        }
      ]
    },

    // If statement: x === null || x === undefined
    {
      code: 'if (x === null || x === undefined) { x = 5 }',
      output: 'x ??= 5',
      errors: [
        {
          messageId: 'preferNullishCoalescingAssignment',
          line: 1,
          column: 1
        }
      ]
    },

    // If statement: x === undefined || x === null
    {
      code: 'if (x === undefined || x === null) { x = 5 }',
      output: 'x ??= 5',
      errors: [
        {
          messageId: 'preferNullishCoalescingAssignment',
          line: 1,
          column: 1
        }
      ]
    },

    // If statement: loose == null
    {
      code: 'if (x == null) { x = 5 }',
      output: 'x ??= 5',
      errors: [
        {
          messageId: 'preferNullishCoalescingAssignment',
          line: 1,
          column: 1
        }
      ]
    },

    // If statement: multiline with block
    {
      code: `if (x === null || x === undefined) {
  x = 5
}`,
      output: 'x ??= 5',
      errors: [
        {
          messageId: 'preferNullishCoalescingAssignment',
          line: 1,
          column: 1
        }
      ]
    },

    // Multiple patterns in one file
    {
      code: `const a = x !== null && x !== undefined ? x : 'default';
const b = y == null ? 'fallback' : y;
if (z === null || z === undefined) { z = 10 }`,
      output: `const a = x ?? 'default';
const b = y ?? 'fallback';
z ??= 10`,
      errors: [
        {
          messageId: 'preferNullishCoalescing',
          line: 1,
          column: 11
        },
        {
          messageId: 'preferNullishCoalescing',
          line: 2,
          column: 11
        },
        {
          messageId: 'preferNullishCoalescingAssignment',
          line: 3,
          column: 1
        }
      ]
    }
  ]
});
