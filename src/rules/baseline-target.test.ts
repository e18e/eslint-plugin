import {RuleTester} from 'eslint';
import {RuleTester as TSRuleTester} from '@typescript-eslint/rule-tester';
import {baselineTarget} from './baseline-target.js';
import * as baselineDetector from 'baseline-detector';
import {setBaselineDetector} from '../utils/baseline-detector.js';
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
setBaselineDetector(baselineDetector);

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
      errors: [{messageId: 'exceedsYear', data: {year: 2025, floor: 2023}}]
    },
    {
      code: 'Temporal.Now;',
      errors: [{messageId: 'notBaseline', data: {feature: 'temporal'}}]
    }
  ]
});

typedRuleTester.run('baseline-target (typed)', baselineTarget, {
  valid: ['const x = [1, 2, 3].at(-1);'],
  invalid: [
    {
      code: 'const {promise} = Promise.withResolvers<number>();',
      errors: [{messageId: 'exceedsYear', data: {year: 2024, floor: 2023}}]
    }
  ]
});
