import {RuleTester} from 'eslint';
import {noSpreadInReduce} from './no-spread-in-reduce.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('no-spread-in-reduce', noSpreadInReduce, {
  valid: [
    // mutating reduce — fine
    'arr.reduce((acc, x) => { acc.push(x); return acc; }, []);',
    'arr.reduce((acc, x) => { acc[x.k] = x.v; return acc; }, {});',
    'arr.reduce((acc, x) => acc + x, 0);',

    // spread of something other than the accumulator
    'arr.reduce((acc, x) => [...other, x], []);',
    'arr.reduce((acc, x) => ({...other, ...x}), {});',

    // accumulator destructured — out of scope (we only handle Identifier params)
    'arr.reduce(({list}, x) => [...list, x], {list: []});',

    // not a reduce call
    'arr.map(x => [...prev, x]);',
    'arr.filter(x => true);'
  ],

  invalid: [
    // expression body, array spread
    {
      code: 'arr.reduce((acc, x) => [...acc, x], []);',
      errors: [{messageId: 'noSpreadInReduce'}]
    },
    // expression body, object spread
    {
      code: 'arr.reduce((acc, x) => ({...acc, [x.k]: x.v}), {});',
      errors: [{messageId: 'noSpreadInReduce'}]
    },
    // block body, terminal return with array spread
    {
      code: 'arr.reduce((acc, x) => { return [...acc, x * 2]; }, []);',
      errors: [{messageId: 'noSpreadInReduce'}]
    },
    // block body, terminal return with object spread
    {
      code: 'arr.reduce((acc, item) => { return {...acc, [item.id]: item}; }, {});',
      errors: [{messageId: 'noSpreadInReduce'}]
    },
    // function expression callback
    {
      code: 'arr.reduce(function (acc, x) { return [...acc, x]; }, []);',
      errors: [{messageId: 'noSpreadInReduce'}]
    },
    // reduceRight is also covered
    {
      code: 'arr.reduceRight((acc, x) => [...acc, x], []);',
      errors: [{messageId: 'noSpreadInReduce'}]
    },
    // accumulator named differently
    {
      code: 'arr.reduce((memo, item) => [...memo, item], []);',
      errors: [{messageId: 'noSpreadInReduce'}]
    },
    // multiple spread elements after accumulator (still O(N²))
    {
      code: 'arr.reduce((acc, x) => [...acc, x, x + 1], []);',
      errors: [{messageId: 'noSpreadInReduce'}]
    },
    // intermediate work then return spread — still flagged
    {
      code: 'arr.reduce((acc, x) => { const y = x + 1; return [...acc, y]; }, []);',
      errors: [{messageId: 'noSpreadInReduce'}]
    },
    // spread NOT first in array — same O(N²) cost
    {
      code: 'arr.reduce((acc, x) => [x, ...acc], []);',
      errors: [{messageId: 'noSpreadInReduce'}]
    },
    {
      code: 'arr.reduce((acc, x) => [x, ...acc, y], []);',
      errors: [{messageId: 'noSpreadInReduce'}]
    },
    // spread NOT first in object — same O(N²) cost
    {
      code: 'arr.reduce((acc, x) => ({[x.k]: x.v, ...acc}), {});',
      errors: [{messageId: 'noSpreadInReduce'}]
    },
    {
      code: 'arr.reduce((acc, x) => ({a: 1, ...acc, b: 2}), {});',
      errors: [{messageId: 'noSpreadInReduce'}]
    }
  ]
});
