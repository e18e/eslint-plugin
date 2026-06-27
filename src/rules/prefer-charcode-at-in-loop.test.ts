import {RuleTester} from 'eslint';
import {RuleTester as TSRuleTester} from '@typescript-eslint/rule-tester';
import {preferCharCodeAtInLoop} from './prefer-charcode-at-in-loop.js';
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

ruleTester.run(
  'prefer-charcode-at-in-loop (untyped)',
  preferCharCodeAtInLoop as never,
  {
    valid: [
      "if ('abc'[0] === 'a') {}",
      "for (let i = 0; i < n; i++) { if (str[i] === '/') {} }",
      "for (const char of chars) { if (char === 'a') {} }",
      "for (const x of arr) { if (str[i] === 'ab') {} }",
      "for (const x of arr) { if (str[i] === '') {} }",
      "for (const x of arr) { if (str[i] < 'a') {} }",
      "for (const x of arr) { if (str.x === 'a') {} }",
      "for (let i = 0; i < n; i++) { if (str?.[i] === '/') {} }",
      'for (let i = 0; i < n; i++) { if (str[i] === other[i]) {} }',
      "for (const x of arr) { if ('abc'['x'] === 'a') {} }",
      "for (const x of arr) { if ('abc'[1.5] === 'a') {} }",
      "for (const x of arr) { function inner() { return 'abc'[0] === 'a'; } }",
      "for (const x of arr) { const f = () => 'abc'[0] === 'a'; }"
    ],

    invalid: [
      {
        code: "for (let i = 0; i < 3; i++) { if ('abc'[i] === 'a') break; }",
        errors: [
          {
            messageId: 'preferCharCodeAt',
            suggestions: [
              {
                messageId: 'replaceWithCharCodeAt',
                output:
                  "for (let i = 0; i < 3; i++) { if ('abc'.charCodeAt(i) === 97) break; }"
              }
            ]
          }
        ]
      },
      {
        code: "while (i < n) { if (`abc`[i] !== '\\n') i++; }",
        errors: [
          {
            messageId: 'preferCharCodeAt',
            suggestions: [
              {
                messageId: 'replaceWithCharCodeAt',
                output: 'while (i < n) { if (`abc`.charCodeAt(i) !== 10) i++; }'
              }
            ]
          }
        ]
      }
    ]
  }
);

typedRuleTester.run(
  'prefer-charcode-at-in-loop (typed)',
  preferCharCodeAtInLoop,
  {
    valid: [
      "const str: string = ''; if (str[0] === '/') {}",
      "const chars: string[] = []; for (let i = 0; i < chars.length; i++) { if (chars[i] === 'a') {} }",
      "const values: unknown[] = []; for (let i = 0; i < values.length; i++) { if (values[i] === 'a') {} }",
      "const str: string = ''; for (let i = 0; i < str.length; i++) { if (str[i] === 'ab') {} }",
      "const str: string = ''; for (let i = 0; i < str.length; i++) { if (str[i] < 'a') {} }",
      "declare const s: any; for (let i = 0; i < 3; i++) { if (s[i] === 'a') {} }",
      "declare const obj: Record<string, unknown>; const str: string = ''; for (const k in obj) { if (str[k] === 'a') {} }",
      "const str: string = ''; for (let i = 0; i < str.length; i++) { if (str['x'] === 'a') {} }"
    ],

    invalid: [
      {
        code: "const str: string = ''; for (let i = 0; i < str.length; i++) { if (str[i] === '/') break; }",
        errors: [
          {
            messageId: 'preferCharCodeAt',
            suggestions: [
              {
                messageId: 'replaceWithCharCodeAt',
                output:
                  "const str: string = ''; for (let i = 0; i < str.length; i++) { if (str.charCodeAt(i) === 47) break; }"
              }
            ]
          }
        ]
      },
      {
        code: "const str: string = ''; for (let i = 0; i < str.length; i++) { if ('{' === str[i]) {} }",
        errors: [
          {
            messageId: 'preferCharCodeAt',
            suggestions: [
              {
                messageId: 'replaceWithCharCodeAt',
                output:
                  "const str: string = ''; for (let i = 0; i < str.length; i++) { if (123 === str.charCodeAt(i)) {} }"
              }
            ]
          }
        ]
      },
      {
        code: "declare const line: {text: string}; for (const item of items) { if (line.text[0] === '#') {} }",
        errors: [
          {
            messageId: 'preferCharCodeAt',
            suggestions: [
              {
                messageId: 'replaceWithCharCodeAt',
                output:
                  'declare const line: {text: string}; for (const item of items) { if (line.text.charCodeAt(0) === 35) {} }'
              }
            ]
          }
        ]
      },
      {
        code: "function f(dep: string) { for (const item of items) dep[0] !== '!' && use(dep); }",
        errors: [
          {
            messageId: 'preferCharCodeAt',
            suggestions: [
              {
                messageId: 'replaceWithCharCodeAt',
                output:
                  'function f(dep: string) { for (const item of items) dep.charCodeAt(0) !== 33 && use(dep); }'
              }
            ]
          }
        ]
      },
      {
        code: "declare const a: {b: string}; for (const x of arr) { if ((a?.b)[0] === 'a') {} }",
        errors: [
          {
            messageId: 'preferCharCodeAt',
            suggestions: [
              {
                messageId: 'replaceWithCharCodeAt',
                output:
                  'declare const a: {b: string}; for (const x of arr) { if ((a?.b).charCodeAt(0) === 97) {} }'
              }
            ]
          }
        ]
      }
    ]
  }
);
