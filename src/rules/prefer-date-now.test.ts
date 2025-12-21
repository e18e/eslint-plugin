import {RuleTester} from 'eslint';
import {preferDateNow} from './prefer-date-now.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-date-now', preferDateNow, {
  valid: [
    'Date.now()',
    'const timestamp = Date.now()',

    // new Date() with arguments
    'new Date(2024, 0, 1)',
    'new Date(timestamp)',
    '+new Date(timestamp)',
    'new Date().toISOString()',

    // other date methods
    'new Date().toString()',
    'new Date().valueOf()',
    'new Date().getFullYear()',

    // other unary operators
    '-new Date()',
    '!new Date()',
    '~new Date()',

    // not calling getTime()
    'new Date().getTime',
    'new Date()[getTime]()',

    // custom constructors
    'new DateFormatter().getTime()',
    'new MyDate().getTime()',

    // window.Date and globalThis.Date with arguments
    'new window.Date(timestamp)',
    'new globalThis.Date(timestamp)',
    '+new window.Date(timestamp)',
    '+new globalThis.Date(timestamp)'
  ],

  invalid: [
    {
      code: 'new Date().getTime()',
      output: 'Date.now()',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 1,
          endLine: 1,
          endColumn: 21
        }
      ]
    },
    {
      code: '+new Date()',
      output: 'Date.now()',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 1,
          endLine: 1,
          endColumn: 12
        }
      ]
    },

    // variable assignment
    {
      code: 'const timestamp = new Date().getTime()',
      output: 'const timestamp = Date.now()',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 19,
          endLine: 1,
          endColumn: 39
        }
      ]
    },

    // variable assignment with unary plus
    {
      code: 'const timestamp = +new Date()',
      output: 'const timestamp = Date.now()',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 19,
          endLine: 1,
          endColumn: 30
        }
      ]
    },

    // expressions
    {
      code: 'const elapsed = new Date().getTime() - startTime',
      output: 'const elapsed = Date.now() - startTime',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 17,
          endLine: 1,
          endColumn: 37
        }
      ]
    },

    // unary plus in expressions
    {
      code: 'const elapsed = +new Date() - startTime',
      output: 'const elapsed = Date.now() - startTime',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 17,
          endLine: 1,
          endColumn: 28
        }
      ]
    },

    // function calls
    {
      code: 'console.log(new Date().getTime())',
      output: 'console.log(Date.now())',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 13,
          endLine: 1,
          endColumn: 33
        }
      ]
    },

    // unary plus in function calls
    {
      code: 'console.log(+new Date())',
      output: 'console.log(Date.now())',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 13,
          endLine: 1,
          endColumn: 24
        }
      ]
    },

    // window.Date variants
    {
      code: 'new window.Date().getTime()',
      output: 'window.Date.now()',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 1,
          endLine: 1,
          endColumn: 28
        }
      ]
    },

    {
      code: '+new window.Date()',
      output: 'window.Date.now()',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 1,
          endLine: 1,
          endColumn: 19
        }
      ]
    },
    {
      code: 'const timestamp = new window.Date().getTime()',
      output: 'const timestamp = window.Date.now()',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 19,
          endLine: 1,
          endColumn: 46
        }
      ]
    },
    {
      code: 'const timestamp = +new window.Date()',
      output: 'const timestamp = window.Date.now()',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 19,
          endLine: 1,
          endColumn: 37
        }
      ]
    },

    // globalThis.Date variants
    {
      code: 'new globalThis.Date().getTime()',
      output: 'globalThis.Date.now()',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 1,
          endLine: 1,
          endColumn: 32
        }
      ]
    },
    {
      code: '+new globalThis.Date()',
      output: 'globalThis.Date.now()',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 1,
          endLine: 1,
          endColumn: 23
        }
      ]
    },
    {
      code: 'const timestamp = new globalThis.Date().getTime()',
      output: 'const timestamp = globalThis.Date.now()',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 19,
          endLine: 1,
          endColumn: 50
        }
      ]
    },
    {
      code: 'const timestamp = +new globalThis.Date()',
      output: 'const timestamp = globalThis.Date.now()',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 19,
          endLine: 1,
          endColumn: 41
        }
      ]
    },

    // Multiple occurrences
    {
      code: `const start = new Date().getTime();
const end = new Date().getTime();`,
      output: `const start = Date.now();
const end = Date.now();`,
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 15,
          endLine: 1,
          endColumn: 35
        },
        {
          messageId: 'preferDateNow',
          line: 2,
          column: 13,
          endLine: 2,
          endColumn: 33
        }
      ]
    },

    // Multiple occurrences with mixed patterns
    {
      code: `const a = new Date().getTime();
const b = +new Date();
const c = new window.Date().getTime();
const d = +new globalThis.Date();`,
      output: `const a = Date.now();
const b = Date.now();
const c = window.Date.now();
const d = globalThis.Date.now();`,
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 11,
          endLine: 1,
          endColumn: 31
        },
        {
          messageId: 'preferDateNow',
          line: 2,
          column: 11,
          endLine: 2,
          endColumn: 22
        },
        {
          messageId: 'preferDateNow',
          line: 3,
          column: 11,
          endLine: 3,
          endColumn: 38
        },
        {
          messageId: 'preferDateNow',
          line: 4,
          column: 11,
          endLine: 4,
          endColumn: 33
        }
      ]
    },

    // complex expressions
    {
      code: 'if (new Date().getTime() > deadline) {}',
      output: 'if (Date.now() > deadline) {}',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 25
        }
      ]
    },
    {
      code: 'if (+new Date() > deadline) {}',
      output: 'if (Date.now() > deadline) {}',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 16
        }
      ]
    },

    // array/object literals
    {
      code: 'const obj = { timestamp: new Date().getTime() }',
      output: 'const obj = { timestamp: Date.now() }',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 26,
          endLine: 1,
          endColumn: 46
        }
      ]
    },
    {
      code: 'const arr = [new Date().getTime(), +new Date()]',
      output: 'const arr = [Date.now(), Date.now()]',
      errors: [
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 14,
          endLine: 1,
          endColumn: 34
        },
        {
          messageId: 'preferDateNow',
          line: 1,
          column: 36,
          endLine: 1,
          endColumn: 47
        }
      ]
    }
  ]
});
