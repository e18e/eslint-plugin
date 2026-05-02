import {RuleTester} from 'eslint';
import {noDeleteProperty} from './no-delete-property.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('no-delete-property', noDeleteProperty, {
  valid: [
    // assignment to undefined is the suggested form
    'obj.prop = undefined;',
    "obj['prop'] = undefined;",

    // optional chain — out of scope (returns true regardless)
    'delete obj?.prop;',

    // unrelated unary operators
    'void obj.prop;',
    'typeof obj.prop;',

    // Dynamic-key computed access — these objects are typically used as
    // maps and are already in dictionary mode; the hidden-class deopt
    // argument doesn't apply. Use `Map` if you want dynamic delete
    // semantics; that's an architectural call, not a perf-rule call.
    'delete obj[key];',
    'delete arr[i];',
    'delete obj[fn()];',
    'delete pkg.dependencies[name];',

    // numeric-literal index — array element delete, treated as map-like
    'delete arr[0];',

    // template literal — not a string literal in AST; skip conservatively
    'delete obj[`prop`];'
  ],

  invalid: [
    {
      code: 'delete obj.prop;',
      output: null,
      errors: [
        {
          messageId: 'noDeleteProperty',
          suggestions: [
            {
              messageId: 'replaceWithUndefined',
              output: 'obj.prop = undefined;'
            }
          ]
        }
      ]
    },

    // bracket access with literal
    {
      code: "delete obj['prop'];",
      output: null,
      errors: [
        {
          messageId: 'noDeleteProperty',
          suggestions: [
            {
              messageId: 'replaceWithUndefined',
              output: "obj['prop'] = undefined;"
            }
          ]
        }
      ]
    },

    // this.x
    {
      code: 'class A { m() { delete this.x; } }',
      output: null,
      errors: [
        {
          messageId: 'noDeleteProperty',
          suggestions: [
            {
              messageId: 'replaceWithUndefined',
              output: 'class A { m() { this.x = undefined; } }'
            }
          ]
        }
      ]
    },

    // chained member: delete obj.a.b
    {
      code: 'delete obj.a.b;',
      output: null,
      errors: [
        {
          messageId: 'noDeleteProperty',
          suggestions: [
            {
              messageId: 'replaceWithUndefined',
              output: 'obj.a.b = undefined;'
            }
          ]
        }
      ]
    },

    // delete in expression position — flagged but no suggestion (return value used)
    {
      code: 'if (delete obj.prop) { doStuff(); }',
      output: null,
      errors: [
        {
          messageId: 'noDeleteProperty',
          suggestions: []
        }
      ]
    },
    {
      code: 'const removed = delete obj.prop;',
      output: null,
      errors: [
        {
          messageId: 'noDeleteProperty',
          suggestions: []
        }
      ]
    },
    {
      code: 'function f() { return delete obj.prop; }',
      output: null,
      errors: [
        {
          messageId: 'noDeleteProperty',
          suggestions: []
        }
      ]
    },

    // parenthesized argument — parens stripped from AST, behaves like delete obj.prop
    {
      code: 'delete (obj.prop);',
      output: null,
      errors: [
        {
          messageId: 'noDeleteProperty',
          suggestions: [
            {
              messageId: 'replaceWithUndefined',
              output: 'obj.prop = undefined;'
            }
          ]
        }
      ]
    },

    // process.env.X — flagged but no `= undefined` suggestion
    // (Node coerces to the string "undefined", which doesn't unset the var)
    {
      code: 'delete process.env.OTEL_LOG_LEVEL;',
      output: null,
      errors: [
        {
          messageId: 'noDeleteProperty',
          suggestions: []
        }
      ]
    },

    // Deeper than process.env.X — `process.env.x` is a regular value, suggest as usual
    {
      code: 'delete process.env.cache.entry;',
      output: null,
      errors: [
        {
          messageId: 'noDeleteProperty',
          suggestions: [
            {
              messageId: 'replaceWithUndefined',
              output: 'process.env.cache.entry = undefined;'
            }
          ]
        }
      ]
    }
  ]
});
