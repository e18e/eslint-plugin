import {RuleTester} from 'eslint';
import {RuleTester as TSRuleTester} from '@typescript-eslint/rule-tester';
import {preferRegexTest} from './prefer-regex-test.js';
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

ruleTester.run('prefer-regex-test (untyped)', preferRegexTest as never, {
  valid: [
    // not used in a conditional
    'const result = str.match(/test/);',
    'const result = /test/.exec(str);',
    'const matches = str.match(/test/g);',

    // .test() already used
    'if (/test/.test(str)) {}',
    'if (regex.test(str)) {}',

    // can't resolve to regex
    'if (str.match(pattern)) {}',
    'if (pattern.exec(str)) {}',

    // no arguments
    'if (str.match()) {}',

    // multiple arguments
    "if (str.match(/test/, 'extra')) {}",

    // unrelated method calls
    "if (str.includes('test')) {}",
    "if (str.indexOf('test')) {}"
  ],

  invalid: [
    {
      code: 'if (str.match(/test/)) {}',
      output: 'if (/test/.test(str)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 22
        }
      ]
    },
    {
      code: 'if (/test/.exec(str)) {}',
      output: 'if (/test/.test(str)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 21
        }
      ]
    },

    // with flags
    {
      code: 'if (str.match(/test/i)) {}',
      output: 'if (/test/i.test(str)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 23
        }
      ]
    },

    // while statement
    {
      code: 'while (str.match(/test/)) {}',
      output: 'while (/test/.test(str)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 8,
          endLine: 1,
          endColumn: 25
        }
      ]
    },

    // for statement
    {
      code: 'for (; str.match(/test/);) {}',
      output: 'for (; /test/.test(str);) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 8,
          endLine: 1,
          endColumn: 25
        }
      ]
    },

    // do...while statement
    {
      code: 'do {} while (str.match(/test/));',
      output: 'do {} while (/test/.test(str));',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 14,
          endLine: 1,
          endColumn: 31
        }
      ]
    },

    // using a const regex variable
    {
      code: 'const regex = /test/; if (str.match(regex)) {}',
      output: 'const regex = /test/; if (regex.test(str)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 27,
          endLine: 1,
          endColumn: 43
        }
      ]
    },

    // using a let regex variable
    {
      code: 'let regex = /test/; if (str.match(regex)) {}',
      output: 'let regex = /test/; if (regex.test(str)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 25,
          endLine: 1,
          endColumn: 41
        }
      ]
    },

    // using a var regex variable
    {
      code: 'var regex = /test/; if (str.match(regex)) {}',
      output: 'var regex = /test/; if (regex.test(str)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 25,
          endLine: 1,
          endColumn: 41
        }
      ]
    },

    // using a const regex variable with exec
    {
      code: 'const regex = /test/; if (regex.exec(str)) {}',
      output: 'const regex = /test/; if (regex.test(str)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 27,
          endLine: 1,
          endColumn: 42
        }
      ]
    },

    // member expression as string
    {
      code: 'if (obj.prop.match(/test/)) {}',
      output: 'if (/test/.test(obj.prop)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 27
        }
      ]
    },

    // member expression as regex
    {
      code: 'if (/test/.exec(obj.prop)) {}',
      output: 'if (/test/.test(obj.prop)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 26
        }
      ]
    },

    // multiple patterns
    {
      code: 'if (str.match(/a/)) {}\nif (/b/.exec(str)) {}',
      output: 'if (/a/.test(str)) {}\nif (/b/.test(str)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 19
        },
        {
          messageId: 'preferTest',
          line: 2,
          column: 5,
          endLine: 2,
          endColumn: 18
        }
      ]
    },

    // new RegExp()
    {
      code: "const regex = new RegExp('test'); if (str.match(regex)) {}",
      output: "const regex = new RegExp('test'); if (regex.test(str)) {}",
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 39,
          endLine: 1,
          endColumn: 55
        }
      ]
    },

    // new RegExp() with exec
    {
      code: "const regex = new RegExp('test'); if (regex.exec(str)) {}",
      output: "const regex = new RegExp('test'); if (regex.test(str)) {}",
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 39,
          endLine: 1,
          endColumn: 54
        }
      ]
    },

    // new window.RegExp()
    {
      code: "const regex = new window.RegExp('test'); if (str.match(regex)) {}",
      output:
        "const regex = new window.RegExp('test'); if (regex.test(str)) {}",
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 46,
          endLine: 1,
          endColumn: 62
        }
      ]
    },

    // new globalThis.RegExp()
    {
      code: "const regex = new globalThis.RegExp('test'); if (str.match(regex)) {}",
      output:
        "const regex = new globalThis.RegExp('test'); if (regex.test(str)) {}",
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 50,
          endLine: 1,
          endColumn: 66
        }
      ]
    },

    // negation
    {
      code: 'if (!str.match(/test/)) {}',
      output: 'if (!/test/.test(str)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 6,
          endLine: 1,
          endColumn: 23
        }
      ]
    },

    // ternaries
    {
      code: 'const x = str.match(/test/) ? a : b;',
      output: 'const x = /test/.test(str) ? a : b;',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 11,
          endLine: 1,
          endColumn: 28
        }
      ]
    },

    // inside an AND expression (left side)
    {
      code: 'if (str.match(/test/) && other) {}',
      output: 'if (/test/.test(str) && other) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 22
        }
      ]
    },

    // inside an AND expression (right side)
    {
      code: 'if (other && str.match(/test/)) {}',
      output: 'if (other && /test/.test(str)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 14,
          endLine: 1,
          endColumn: 31
        }
      ]
    },

    // inside an OR expression (left side)
    {
      code: 'if (str.match(/test/) || fallback) {}',
      output: 'if (/test/.test(str) || fallback) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 22
        }
      ]
    },

    // inside an OR expression (right side)
    {
      code: 'if (fallback || str.match(/test/)) {}',
      output: 'if (fallback || /test/.test(str)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 17,
          endLine: 1,
          endColumn: 34
        }
      ]
    },

    // negation in AND expression
    {
      code: 'if (a && !str.match(/test/)) {}',
      output: 'if (a && !/test/.test(str)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 11,
          endLine: 1,
          endColumn: 28
        }
      ]
    },

    // double negation
    {
      code: 'if (!!str.match(/test/)) {}',
      output: 'if (!!/test/.test(str)) {}',
      errors: [
        {
          messageId: 'preferTest',
          line: 1,
          column: 7,
          endLine: 1,
          endColumn: 24
        }
      ]
    }
  ]
});

typedRuleTester.run('prefer-regex-test (typed)', preferRegexTest, {
  valid: [
    // Non-regex types should not be caught
    {
      code: `
        function test(pattern: string) {
          if (str.match(pattern)) {}
        }
      `
    }
  ],

  invalid: [
    // typed function parameter
    {
      code: `
        function test(regex: RegExp, str: string) {
          if (str.match(regex)) {}
        }
      `,
      output: `
        function test(regex: RegExp, str: string) {
          if (regex.test(str)) {}
        }
      `,
      errors: [
        {
          messageId: 'preferTest',
          line: 3,
          column: 15,
          endLine: 3,
          endColumn: 31
        }
      ]
    },

    // typed function return value
    {
      code: `
        function getRegex(): RegExp {
          return /test/;
        }
        if (str.match(getRegex())) {}
      `,
      output: `
        function getRegex(): RegExp {
          return /test/;
        }
        if (getRegex().test(str)) {}
      `,
      errors: [
        {
          messageId: 'preferTest',
          line: 5,
          column: 13,
          endLine: 5,
          endColumn: 34
        }
      ]
    },

    // basic typed variable
    {
      code: `
        const regex: RegExp = getFromSomewhere();
        if (str.match(regex)) {}
      `,
      output: `
        const regex: RegExp = getFromSomewhere();
        if (regex.test(str)) {}
      `,
      errors: [
        {
          messageId: 'preferTest',
          line: 3,
          column: 13,
          endLine: 3,
          endColumn: 29
        }
      ]
    },

    // RegExp from object property
    {
      code: `
        interface Config {
          pattern: RegExp;
        }
        function test(config: Config) {
          if (str.match(config.pattern)) {}
        }
      `,
      output: `
        interface Config {
          pattern: RegExp;
        }
        function test(config: Config) {
          if (config.pattern.test(str)) {}
        }
      `,
      errors: [
        {
          messageId: 'preferTest',
          line: 6,
          column: 15,
          endLine: 6,
          endColumn: 40
        }
      ]
    }
  ]
});
