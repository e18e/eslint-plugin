import {RuleTester} from 'eslint';
import {preferStaticCollator} from './prefer-static-collator.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-static-collator', preferStaticCollator, {
  valid: [
    // Top-level localeCompare — not in a sort callback
    "'a'.localeCompare('b');",
    'const eq = a.localeCompare(b) === 0;',

    // Already using a hoisted collator
    'const collator = new Intl.Collator(); arr.sort((a, b) => collator.compare(a, b));',

    // Inside a non-sort callback (filter)
    'arr.filter((a) => a.localeCompare(b) === 0);',
    'arr.map((a) => a.localeCompare(b));',

    // Inside a top-level FunctionDeclaration — caller may not be hot
    'function compareNames(a, b) { return a.name.localeCompare(b.name); }',

    // localeCompare-like methods on unrelated APIs (none here, sanity)
    'arr.sort((a, b) => a - b);'
  ],

  invalid: [
    // arrow comparator
    {
      code: 'arr.sort((a, b) => a.localeCompare(b));',
      errors: [{messageId: 'preferStaticCollator'}]
    },

    // toSorted
    {
      code: 'arr.toSorted((a, b) => a.localeCompare(b));',
      errors: [{messageId: 'preferStaticCollator'}]
    },

    // member access on each side
    {
      code: 'items.sort((a, b) => a.name.localeCompare(b.name));',
      errors: [{messageId: 'preferStaticCollator'}]
    },

    // function expression comparator
    {
      code: 'arr.sort(function (a, b) { return a.localeCompare(b); });',
      errors: [{messageId: 'preferStaticCollator'}]
    },

    // localeCompare with options — even more expensive
    {
      code: "arr.sort((a, b) => a.localeCompare(b, 'en-US', { sensitivity: 'base' }));",
      errors: [{messageId: 'preferStaticCollator'}]
    },

    // nested inside a block-bodied arrow comparator
    {
      code: 'arr.sort((a, b) => { if (a == b) return 0; return a.localeCompare(b); });',
      errors: [{messageId: 'preferStaticCollator'}]
    },

    // multi-key sort with `||` tie-breaker (knip pattern)
    {
      code: 'arr.sort((a, b) => a.filePath.localeCompare(b.filePath) || a.line - b.line);',
      errors: [{messageId: 'preferStaticCollator'}]
    },

    // multi-key sort where every key uses localeCompare
    {
      code: 'arr.sort((a, b) => a.filePath.localeCompare(b.filePath) || a.id.localeCompare(b.id));',
      errors: [
        {messageId: 'preferStaticCollator'},
        {messageId: 'preferStaticCollator'}
      ]
    },

    // localeCompare on nullish-coalesced operand
    {
      code: "arr.sort((a, b) => (a.x ?? '').localeCompare(b.x ?? ''));",
      errors: [{messageId: 'preferStaticCollator'}]
    },

    // chained sort on a method chain
    {
      code: 'getItems().filter(Boolean).sort((a, b) => a.localeCompare(b));',
      errors: [{messageId: 'preferStaticCollator'}]
    },

    // destructured tuple params on Object.entries().toSorted (emdash pattern)
    {
      code: 'Object.entries(counts).toSorted(([a], [b]) => a.localeCompare(b));',
      errors: [{messageId: 'preferStaticCollator'}]
    }
  ]
});
