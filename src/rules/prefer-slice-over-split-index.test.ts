import {RuleTester} from 'eslint';
import {preferSliceOverSplitIndex} from './prefer-slice-over-split-index.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-slice-over-split-index', preferSliceOverSplitIndex, {
  valid: [
    'const x = s.slice(0, s.indexOf("/"));',
    'const x = s.indexOf("/") < 0 ? s : s.slice(0, s.indexOf("/"));',
    's.split("/").map(x => x);',
    's.split("/").pop();',
    's.split("/").length;',
    's.split(",")[2];',
    's.split(".")[5];',
    's.split(",").length;',
    's.split(",")[i];',
    's.split(",")[idx];',
    's.split()[0];',
    's.split("")[0];',
    's.split(/\\?|#/)[0];',
    's.split(separator)[0];',
    's.split(`${separator}`)[0];',
    's.split(",", limit)[0];',
    's.split(",", 0)[0];',
    's.split(",", 0)[1];',
    's.split(",", 1)[1];',
    's.split(",", 1.5)[0];',
    's.split(",", -1)[0];',
    's.split(",", 2, extra)[0];',
    'arr[0];',
    'fn()[0];',
    'obj.method()[0];'
  ],

  invalid: [
    {
      code: 'const head = s.split("/")[0];',
      errors: [
        {
          messageId: 'preferSliceFirst',
          line: 1,
          column: 14
        }
      ]
    },
    {
      code: 'const head = s.split(`/`)[0];',
      errors: [{messageId: 'preferSliceFirst'}]
    },
    {
      code: 'const head = s.split(",", 1)[0];',
      errors: [{messageId: 'preferSliceFirst'}]
    },
    {
      code: 'const head = s.split(",", 2)[0];',
      errors: [{messageId: 'preferSliceFirst'}]
    },
    {
      code: 'const tail = s.split("=")[1];',
      errors: [
        {
          messageId: 'preferSliceSecond',
          line: 1,
          column: 14
        }
      ]
    },
    {
      code: 'const tail = s.split("=", 2)[1];',
      errors: [{messageId: 'preferSliceSecond'}]
    },
    {
      code: 'const head = url.toLowerCase().split("?")[0];',
      errors: [{messageId: 'preferSliceFirst'}]
    },
    {
      code: 'arr.map(x => x?.split(":")[0]);',
      errors: [{messageId: 'preferSliceFirst'}]
    },
    {
      code: 'const head = msg.split("\\n", 1)[0];',
      errors: [{messageId: 'preferSliceFirst'}]
    },
    {
      code: 'doStuff(line.split(":")[0]);',
      errors: [{messageId: 'preferSliceFirst'}]
    }
  ]
});
