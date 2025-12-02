import {RuleTester} from 'eslint';
import {preferObjectHasOwn} from './prefer-object-has-own.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-object-has-own', preferObjectHasOwn, {
  valid: [
    "const has = Object.hasOwn(obj, 'key');",
    'const has = Object.hasOwn(myObject, property);',

    // Other object methods
    'const value = obj.getValue();',
    'const result = Object.keys(obj);',

    // Wrong number of arguments
    'const result = obj.hasOwnProperty();',
    "const result = obj.hasOwnProperty('key', 'extra');",
    'const result = Object.prototype.hasOwnProperty.call(obj);',
    "const result = Object.prototype.hasOwnProperty.call(obj, 'key', 'extra');"
  ],
  invalid: [
    // obj.hasOwnProperty(prop)
    {
      code: "const has = obj.hasOwnProperty('key');",
      output: "const has = Object.hasOwn(obj, 'key');",
      errors: [{messageId: 'preferObjectHasOwn', line: 1, column: 13}]
    },
    {
      code: "const hasAnother = myObject.hasOwnProperty('property');",
      output: "const hasAnother = Object.hasOwn(myObject, 'property');",
      errors: [{messageId: 'preferObjectHasOwn', line: 1, column: 20}]
    },
    {
      code: 'const has = obj.hasOwnProperty(key);',
      output: 'const has = Object.hasOwn(obj, key);',
      errors: [{messageId: 'preferObjectHasOwn', line: 1, column: 13}]
    },

    // Object.prototype.hasOwnProperty.call(obj, prop)
    {
      code: "const has = Object.prototype.hasOwnProperty.call(obj, 'key');",
      output: "const has = Object.hasOwn(obj, 'key');",
      errors: [{messageId: 'preferObjectHasOwn', line: 1, column: 13}]
    },
    {
      code: "const hasAnother = Object.prototype.hasOwnProperty.call(myObject, 'property');",
      output: "const hasAnother = Object.hasOwn(myObject, 'property');",
      errors: [{messageId: 'preferObjectHasOwn', line: 1, column: 20}]
    },
    {
      code: 'const has = Object.prototype.hasOwnProperty.call(obj, key);',
      output: 'const has = Object.hasOwn(obj, key);',
      errors: [{messageId: 'preferObjectHasOwn', line: 1, column: 13}]
    },

    // Both patterns in same code
    {
      code: `const has1 = obj.hasOwnProperty('key');
const has2 = Object.prototype.hasOwnProperty.call(obj, 'key');`,
      output: `const has1 = Object.hasOwn(obj, 'key');
const has2 = Object.hasOwn(obj, 'key');`,
      errors: [
        {messageId: 'preferObjectHasOwn', line: 1, column: 14},
        {messageId: 'preferObjectHasOwn', line: 2, column: 14}
      ]
    },

    // In conditional expressions
    {
      code: "if (obj.hasOwnProperty('key')) { }",
      output: "if (Object.hasOwn(obj, 'key')) { }",
      errors: [{messageId: 'preferObjectHasOwn', line: 1, column: 5}]
    },
    {
      code: "const result = obj.hasOwnProperty('prop') ? 'yes' : 'no';",
      output: "const result = Object.hasOwn(obj, 'prop') ? 'yes' : 'no';",
      errors: [{messageId: 'preferObjectHasOwn', line: 1, column: 16}]
    },

    // Nested objects
    {
      code: "const has = obj.nested.hasOwnProperty('key');",
      output: "const has = Object.hasOwn(obj.nested, 'key');",
      errors: [{messageId: 'preferObjectHasOwn', line: 1, column: 13}]
    },

    // Complex property expressions
    {
      code: "const has = obj.hasOwnProperty(key + 'suffix');",
      output: "const has = Object.hasOwn(obj, key + 'suffix');",
      errors: [{messageId: 'preferObjectHasOwn', line: 1, column: 13}]
    },
    {
      code: 'const has = obj.hasOwnProperty(arr[0]);',
      output: 'const has = Object.hasOwn(obj, arr[0]);',
      errors: [{messageId: 'preferObjectHasOwn', line: 1, column: 13}]
    },

    // In return statements
    {
      code: "function check(obj) { return obj.hasOwnProperty('key'); }",
      output: "function check(obj) { return Object.hasOwn(obj, 'key'); }",
      errors: [{messageId: 'preferObjectHasOwn', line: 1, column: 30}]
    },

    // In logical expressions
    {
      code: "const result = obj.hasOwnProperty('a') && obj.hasOwnProperty('b');",
      output:
        "const result = Object.hasOwn(obj, 'a') && Object.hasOwn(obj, 'b');",
      errors: [
        {messageId: 'preferObjectHasOwn', line: 1, column: 16},
        {messageId: 'preferObjectHasOwn', line: 1, column: 43}
      ]
    }
  ]
});
