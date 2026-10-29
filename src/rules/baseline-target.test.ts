import {Linter, RuleTester} from 'eslint';
import css from '@eslint/css';
import {RuleTester as TSRuleTester} from '@typescript-eslint/rule-tester';
import {baselineTarget} from './baseline-target.js';
import * as path from 'node:path';
import {describe, expect, it} from 'vitest';
import {fileURLToPath} from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const yearSettings = {e18e: {baseline: {target: 2023}}};

const typedRuleTester = new TSRuleTester({
  settings: yearSettings,
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
  settings: yearSettings,
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

const cssRuleTester = new RuleTester({
  settings: yearSettings,
  plugins: {css},
  language: 'css/css'
});

cssRuleTester.run('baseline-target (css)', baselineTarget as never, {
  valid: [
    {code: 'a { color: red; }', filename: 'test.css'},
    {code: 'b { height: 100dvh; }', filename: 'test.css'}
  ],
  invalid: [
    {
      code: 'a { text-wrap: balance; }',
      filename: 'test.css',
      errors: [
        {
          messageId: 'exceedsYear',
          data: {feature: 'text-wrap', year: 2024, floor: 2023},
          line: 1,
          column: 5,
          endLine: 1,
          endColumn: 14
        },
        {
          messageId: 'exceedsYear',
          data: {feature: 'text-wrap-balance', year: 2024, floor: 2023},
          line: 1,
          column: 16,
          endLine: 1,
          endColumn: 23
        }
      ]
    },
    {
      code: '.a { anchor-name: --a; }',
      filename: 'test.css',
      errors: [
        {
          messageId: 'notBaseline',
          data: {feature: 'anchor-positioning'},
          line: 1,
          column: 6,
          endLine: 1,
          endColumn: 17
        }
      ]
    }
  ]
});

const targetRuleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

targetRuleTester.run('baseline-target (targets)', baselineTarget as never, {
  valid: [
    'const x = a ?? b;',
    {
      code: 'new URLPattern();',
      settings: {e18e: {baseline: {target: 'newly available'}}}
    },
    {
      code: 'new URLPattern();',
      settings: {e18e: {baseline: {target: 2025}}}
    }
  ],
  invalid: [
    {
      code: 'new URLPattern();',
      errors: [
        {
          messageId: 'notWidelyAvailable',
          data: {feature: 'urlpattern'},
          line: 1,
          column: 5
        }
      ]
    },
    {
      code: 'new URLPattern();',
      settings: {e18e: {baseline: {target: 'widely available'}}},
      errors: [{messageId: 'notWidelyAvailable'}]
    },
    {
      code: 'Temporal.Now;',
      settings: {e18e: {baseline: {target: 'newly available'}}},
      errors: [{messageId: 'notBaseline', data: {feature: 'temporal'}}]
    }
  ]
});

describe('baseline-target settings', () => {
  it('rejects an unknown target', () => {
    const linter = new Linter();
    expect(() =>
      linter.verify(
        'x = 1;',
        {
          plugins: {e18e: {rules: {'baseline-target': baselineTarget}}},
          settings: {e18e: {baseline: {target: 'soon'}}},
          rules: {'e18e/baseline-target': 'error'}
        } as never,
        {filename: 'x.js'}
      )
    ).toThrow('Invalid settings.e18e.baseline.target "soon"');
  });
});
