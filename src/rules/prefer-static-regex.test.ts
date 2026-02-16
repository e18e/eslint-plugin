import {RuleTester} from 'eslint';
import {preferStaticRegex} from './prefer-static-regex.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-static-regex', preferStaticRegex, {
  valid: [
    'const RE = /foo/;',
    'const RE = /foo/gi;',
    'const RE = new RegExp("foo");',
    'const RE = new RegExp("foo", "g");',

    // Dynamic regex
    'function f(p) { return new RegExp(p); }',
    'function f(p) { return new RegExp(p, "g"); }',
    'function f(p) { return new RegExp("foo" + p); }',

    // Not inside a function
    '/foo/.test("bar");',
    'new RegExp("foo").test("bar");',

    // new RegExp with no args
    'function f() { return new RegExp(); }'
  ],
  invalid: [
    // function declaration
    {
      code: 'function f(s) { return /foo/.test(s); }',
      errors: [
        {
          messageId: 'preferStatic',
          line: 1,
          column: 24,
          endLine: 1,
          endColumn: 29
        }
      ]
    },
    // arrow function
    {
      code: 'const f = (s) => /foo/.test(s);',
      errors: [
        {
          messageId: 'preferStatic',
          line: 1,
          column: 18,
          endLine: 1,
          endColumn: 23
        }
      ]
    },
    // function expression
    {
      code: 'const f = function(s) { return /foo/.test(s); };',
      errors: [
        {
          messageId: 'preferStatic',
          line: 1,
          column: 32,
          endLine: 1,
          endColumn: 37
        }
      ]
    },
    // class method
    {
      code: 'class C { m(s) { return /foo/.test(s); } }',
      errors: [
        {
          messageId: 'preferStatic',
          line: 1,
          column: 25,
          endLine: 1,
          endColumn: 30
        }
      ]
    },
    // with flags
    {
      code: 'function f(s) { return /foo/gi.test(s); }',
      errors: [
        {
          messageId: 'preferStatic',
          line: 1,
          column: 24,
          endLine: 1,
          endColumn: 31
        }
      ]
    },
    // with string literal in function
    {
      code: 'function f(s) { return new RegExp("foo").test(s); }',
      errors: [
        {
          messageId: 'preferStatic',
          line: 1,
          column: 24,
          endLine: 1,
          endColumn: 41
        }
      ]
    },
    // with string literal and flags in function
    {
      code: 'function f(s) { return new RegExp("foo", "gi").test(s); }',
      errors: [
        {
          messageId: 'preferStatic',
          line: 1,
          column: 24,
          endLine: 1,
          endColumn: 47
        }
      ]
    },
    // assigned to const inside function
    {
      code: 'function f(s) { const re = /foo/; return re.test(s); }',
      errors: [
        {
          messageId: 'preferStatic',
          line: 1,
          column: 28,
          endLine: 1,
          endColumn: 33
        }
      ]
    },
    // Nested function
    {
      code: 'function outer() { function inner(s) { return /foo/.test(s); } }',
      errors: [
        {
          messageId: 'preferStatic',
          line: 1,
          column: 47,
          endLine: 1,
          endColumn: 52
        }
      ]
    },
    // Multiple regexes in same function
    {
      code: 'function f(s) { /foo/.test(s); /bar/.test(s); }',
      errors: [
        {
          messageId: 'preferStatic',
          line: 1,
          column: 17,
          endLine: 1,
          endColumn: 22
        },
        {
          messageId: 'preferStatic',
          line: 1,
          column: 32,
          endLine: 1,
          endColumn: 37
        }
      ]
    },
    // Regex in string replace
    {
      code: 'function f(s) { return s.replace(/foo/g, "bar"); }',
      errors: [
        {
          messageId: 'preferStatic',
          line: 1,
          column: 34,
          endLine: 1,
          endColumn: 40
        }
      ]
    }
  ]
});
