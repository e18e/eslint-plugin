import {RuleTester} from 'eslint';
import {RuleTester as TSRuleTester} from '@typescript-eslint/rule-tester';
import {baselineTarget} from './baseline-target.js';
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

ruleTester.run('baseline-target', baselineTarget as never, {
  valid: ['const x = a ?? b;', 'x = 1;'],
  invalid: [
    {
      code: 'new URLPattern();',
      errors: [
        {
          messageId: 'exceedsYear',
          data: {feature: 'urlpattern', year: 2025, floor: 2023},
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 15
        }
      ]
    },
    {
      code: 'Temporal.Now;',
      errors: [
        {
          messageId: 'notBaseline',
          data: {feature: 'temporal'},
          line: 1,
          column: 1,
          endLine: 1,
          endColumn: 9
        }
      ]
    },
    {
      code: 'const a = 1;\nnew URLPattern();\nnew URLPattern();',
      errors: [
        {messageId: 'exceedsYear', line: 2, column: 5},
        {messageId: 'exceedsYear', line: 3, column: 5}
      ]
    }
  ]
});

typedRuleTester.run('baseline-target (typed)', baselineTarget, {
  valid: ['const x = [1, 2, 3].at(-1);'],
  invalid: [
    {
      code: 'const {promise} = Promise.withResolvers<number>();',
      errors: [
        {
          messageId: 'exceedsYear',
          data: {feature: 'promise-withresolvers', year: 2024, floor: 2023},
          line: 1,
          column: 27,
          endLine: 1,
          endColumn: 40
        }
      ]
    }
  ]
});
