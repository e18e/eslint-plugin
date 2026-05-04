import {RuleTester} from 'eslint';
import {preferFlatMapOverMapFlat} from './prefer-flatmap-over-map-flat.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-flatmap-over-map-flat', preferFlatMapOverMapFlat, {
  valid: [
    // already flatMap
    'arr.flatMap(fn);',

    // .flat() depth > 1 — flatMap can't replicate
    'arr.map(fn).flat(2);',
    'arr.map(fn).flat(Infinity);',

    // .flat(0) — no-op, equivalent to .map alone — skip
    'arr.map(fn).flat(0);',

    // non-literal depth — skip
    'arr.map(fn).flat(depth);',

    // .map with thisArg or zero args — skip
    'arr.map(fn, thisArg).flat();',
    'arr.map().flat();',

    // .flat() called on something other than .map(...)
    'arr.flat();',
    'arr.filter(fn).flat();',
    'getNested().flat();',

    // .map().flat called via computed access — skip
    'arr.map(fn)["flat"]();'
  ],

  invalid: [
    {
      code: 'arr.map(x => x * 2).flat();',
      output: 'arr.flatMap(x => x * 2);',
      errors: [{messageId: 'preferFlatMap'}]
    },
    {
      code: 'arr.map(fn).flat();',
      output: 'arr.flatMap(fn);',
      errors: [{messageId: 'preferFlatMap'}]
    },
    {
      code: 'arr.map(x => [x, x]).flat();',
      output: 'arr.flatMap(x => [x, x]);',
      errors: [{messageId: 'preferFlatMap'}]
    },
    {
      code: 'arr.map(fn).flat(1);',
      output: 'arr.flatMap(fn);',
      errors: [{messageId: 'preferFlatMap'}]
    },
    // chained call expression on receiver
    {
      code: 'getItems().filter(Boolean).map(fn).flat();',
      output: 'getItems().filter(Boolean).flatMap(fn);',
      errors: [{messageId: 'preferFlatMap'}]
    },
    // multiline / function expression mapper
    {
      code: 'arr.map(function (x) { return x.children; }).flat();',
      output: 'arr.flatMap(function (x) { return x.children; });',
      errors: [{messageId: 'preferFlatMap'}]
    },
    // optional chaining on the receiver
    {
      code: 'arr?.map(fn).flat();',
      output: 'arr?.flatMap(fn);',
      errors: [{messageId: 'preferFlatMap'}]
    },
    // optional chaining before .flat (no-op on map's array result)
    {
      code: 'arr.map(fn)?.flat();',
      output: 'arr.flatMap(fn);',
      errors: [{messageId: 'preferFlatMap'}]
    },
    // optional chaining at both points
    {
      code: 'arr?.map(fn)?.flat();',
      output: 'arr?.flatMap(fn);',
      errors: [{messageId: 'preferFlatMap'}]
    },
    // parenthesized inner map call — fixer must not break the closing paren
    {
      code: '(arr.map(fn)).flat();',
      output: '(arr.flatMap(fn));',
      errors: [{messageId: 'preferFlatMap'}]
    }
  ]
});
