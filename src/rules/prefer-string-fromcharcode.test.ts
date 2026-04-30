import {RuleTester} from 'eslint';
import {preferStringFromCharCode} from './prefer-string-fromcharcode.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-string-fromcharcode', preferStringFromCharCode, {
  valid: [
    // already using fromCharCode
    'String.fromCharCode(65);',
    'String.fromCharCode(72, 105);',

    // outside fromCharCode range
    'String.fromCodePoint(0x10000);',
    'String.fromCodePoint(0x1F600);',
    'String.fromCodePoint(65, 0x1F600);',

    // non-literal arg
    'String.fromCodePoint(n);',
    'String.fromCodePoint(getCode());',
    'String.fromCodePoint(65, code);',

    // no args
    'String.fromCodePoint();',

    // spread
    'String.fromCodePoint(...codes);',

    // negative or non-integer
    'String.fromCodePoint(-1);',
    'String.fromCodePoint(1.5);',

    // not the global String
    'fromCodePoint(65);',
    'foo.fromCodePoint(65);',
    'String["fromCodePoint"](65);'
  ],

  invalid: [
    // single literal
    {
      code: 'String.fromCodePoint(65);',
      output: 'String.fromCharCode(65);',
      errors: [{messageId: 'preferFromCharCode'}]
    },
    // ASCII null
    {
      code: 'String.fromCodePoint(0);',
      output: 'String.fromCharCode(0);',
      errors: [{messageId: 'preferFromCharCode'}]
    },
    // upper boundary
    {
      code: 'String.fromCodePoint(0xFFFF);',
      output: 'String.fromCharCode(0xFFFF);',
      errors: [{messageId: 'preferFromCharCode'}]
    },
    // multiple literals
    {
      code: 'String.fromCodePoint(72, 105, 33);',
      output: 'String.fromCharCode(72, 105, 33);',
      errors: [{messageId: 'preferFromCharCode'}]
    },
    // expression position
    {
      code: 'const ch = String.fromCodePoint(97);',
      output: 'const ch = String.fromCharCode(97);',
      errors: [{messageId: 'preferFromCharCode'}]
    }
  ]
});
