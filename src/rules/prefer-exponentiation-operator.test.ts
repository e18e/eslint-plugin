import {RuleTester} from 'eslint';
import {preferExponentiationOperator} from './prefer-exponentiation-operator.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-exponentiation-operator', preferExponentiationOperator, {
  valid: [
    'const result = x ** y;',
    'const squared = 2 ** 3;',

    // Other Math methods
    'const result = Math.sqrt(4);',
    'const result = Math.floor(3.7);',

    // different number of arguments
    'const result = Math.pow(2);',
    'const result = Math.pow(2, 3, 4);'
  ],
  invalid: [
    {
      code: 'const result = Math.pow(2, 3);',
      output: 'const result = (2) ** (3);',
      errors: [{messageId: 'preferExponentiation', line: 1, column: 16}]
    },
    {
      code: 'const squared = Math.pow(x, 2);',
      output: 'const squared = (x) ** (2);',
      errors: [{messageId: 'preferExponentiation', line: 1, column: 17}]
    },
    {
      code: 'const complex = Math.pow(base, exponent);',
      output: 'const complex = (base) ** (exponent);',
      errors: [{messageId: 'preferExponentiation', line: 1, column: 17}]
    },

    // nested calls
    // RuleTester only applies one fix at a time FYI
    {
      code: 'const result = Math.pow(Math.pow(2, 3), 4);',
      output: 'const result = (Math.pow(2, 3)) ** (4);',
      errors: [
        {messageId: 'preferExponentiation', line: 1, column: 16},
        {messageId: 'preferExponentiation', line: 1, column: 25}
      ]
    },

    // expressions
    {
      code: 'const result = Math.pow(a + b, c - d) * 2;',
      output: 'const result = (a + b) ** (c - d) * 2;',
      errors: [{messageId: 'preferExponentiation', line: 1, column: 16}]
    },
    {
      code: 'const value = 10 + Math.pow(x, y);',
      output: 'const value = 10 + (x) ** (y);',
      errors: [{messageId: 'preferExponentiation', line: 1, column: 20}]
    },

    // Multiple calls in one statement
    {
      code: 'const result = Math.pow(a, 2) + Math.pow(b, 2);',
      output: 'const result = (a) ** (2) + (b) ** (2);',
      errors: [
        {messageId: 'preferExponentiation', line: 1, column: 16},
        {messageId: 'preferExponentiation', line: 1, column: 33}
      ]
    },

    // complex expressions
    {
      code: 'const result = Math.pow(x * y, z / 2);',
      output: 'const result = (x * y) ** (z / 2);',
      errors: [{messageId: 'preferExponentiation', line: 1, column: 16}]
    },

    // function argument
    {
      code: 'console.log(Math.pow(2, 10));',
      output: 'console.log((2) ** (10));',
      errors: [{messageId: 'preferExponentiation', line: 1, column: 13}]
    },

    // return statement
    {
      code: 'function square(x) { return Math.pow(x, 2); }',
      output: 'function square(x) { return (x) ** (2); }',
      errors: [{messageId: 'preferExponentiation', line: 1, column: 29}]
    },

    // member expressions
    {
      code: 'const result = Math.pow(obj.value, arr[0]);',
      output: 'const result = (obj.value) ** (arr[0]);',
      errors: [{messageId: 'preferExponentiation', line: 1, column: 16}]
    },

    // function calls
    {
      code: 'const result = Math.pow(getValue(), getExponent());',
      output: 'const result = (getValue()) ** (getExponent());',
      errors: [{messageId: 'preferExponentiation', line: 1, column: 16}]
    }
  ]
});
