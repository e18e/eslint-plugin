import {RuleTester} from 'eslint';
import {RuleTester as TSRuleTester} from '@typescript-eslint/rule-tester';
import {preferGetOrInsert} from './prefer-get-or-insert.js';
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

ruleTester.run('prefer-get-or-insert', preferGetOrInsert as never, {
  valid: [
    // plain get/set, no default
    'map.set(k, map.get(k));',

    // setting an unrelated value
    'map.set(k, other.get(k) ?? def);',
    'map.set(k, map.get(other) ?? def);',

    // different map between set and get
    'map.set(k, other.has(k) ? other.get(k) : def);',

    // ternary uses a different key for has vs get
    'map.set(k, map.has(k) ? map.get(other) : def);',

    // read-with-default that is never written back
    'const v = map.get(k) ?? def; use(v);',
    'const v = map.has(k) ? map.get(k) : def; use(v);',

    // written back to a different map / key
    'const v = map.get(k) ?? def; other.set(k, v);',
    'const v = map.get(k) ?? def; map.set(other, v);',

    // written back, but a different variable
    'const v = map.get(k) ?? def; map.set(k, somethingElse);',

    // set in a different block than the declaration
    'const v = map.get(k) ?? def; if (x) { map.set(k, v); }',

    // computed / optional access is out of scope
    'map["set"](k, map.get(k) ?? def);',
    'map?.set(k, map.get(k) ?? def);',

    // logical operators other than ??
    'map.set(k, map.get(k) || def);',

    // guarded lazy-init that never writes the default back
    'let v = map.get(k); if (!v) { v = def; }',

    // guarded lazy-init writing back to a different map / key
    'let v = map.get(k); if (!v) { v = def; other.set(k, v); }',
    'let v = map.get(k); if (!v) { v = def; map.set(other, v); }'
  ],

  invalid: [
    // map.set(k, map.get(k) ?? default)
    {
      code: 'map.set(k, map.get(k) ?? def);',
      output: 'map.getOrInsert(k, def);',
      errors: [{messageId: 'preferGetOrInsert'}]
    },
    // member-expression key
    {
      code: 'cache.set(obj.id, cache.get(obj.id) ?? createDefault());',
      output: 'cache.getOrInsert(obj.id, createDefault());',
      errors: [{messageId: 'preferGetOrInsert'}]
    },
    // map.set(k, map.has(k) ? map.get(k) : default)
    {
      code: 'map.set(k, map.has(k) ? map.get(k) : []);',
      output: 'map.getOrInsert(k, []);',
      errors: [{messageId: 'preferGetOrInsert'}]
    },
    // member-expression receiver
    {
      code: 'this.cache.set(k, this.cache.get(k) ?? def);',
      output: 'this.cache.getOrInsert(k, def);',
      errors: [{messageId: 'preferGetOrInsert'}]
    },
    // const v = map.get(k) ?? default; ...; map.set(k, v)
    {
      code: `
        const v = map.get(k) ?? def;
        v.push(1);
        map.set(k, v);
      `,
      output: `
        const v = map.getOrInsert(k, def);
        v.push(1);
      `,
      errors: [{messageId: 'preferGetOrInsert'}]
    },
    // const v = map.has(k) ? map.get(k) : default; ...; map.set(k, v)
    {
      code: `
        let v = map.has(k) ? map.get(k) : [];
        map.set(k, v);
      `,
      output: `
        let v = map.getOrInsert(k, []);
      `,
      errors: [{messageId: 'preferGetOrInsert'}]
    },
    // reassignment instead of declaration
    {
      code: `
        v = map.get(k) ?? def;
        map.set(k, v);
      `,
      output: `
        v = map.getOrInsert(k, def);
      `,
      errors: [{messageId: 'preferGetOrInsert'}]
    },
    // let v = map.get(k); if (!v) { v = default; map.set(k, v); }
    {
      code: `
        let v = map.get(k);
        if (!v) {
          v = [];
          map.set(k, v);
        }
      `,
      output: `
        let v = map.getOrInsert(k, []);
      `,
      errors: [{messageId: 'preferGetOrInsert'}]
    }
  ]
});

typedRuleTester.run('prefer-get-or-insert (typed)', preferGetOrInsert, {
  valid: [
    // nullable default
    'declare const map: Map<string, number[]>; declare function fn(): number[] | undefined; map.set("a", map.get("a") ?? fn());',
    'declare const map: Map<string, number[]>; declare function fn(): number[] | null; const v = map.get("a") ?? fn(); map.set("a", v);',

    // nullable map values
    'declare const map: Map<string, number | undefined>; map.set("a", map.get("a") ?? 1);',
    'function f<T>(map: Map<string, T>, d: NonNullable<T>) { map.set("a", map.get("a") ?? d); }',

    // falsy map values
    'declare const map: Map<string, number>; let v = map.get("a"); if (!v) { v = 1; map.set("a", v); }',

    // falsy default
    'declare const map: Map<string, object>; declare const d: object | false; let v = map.get("a"); if (!v) { v = d; map.set("a", v); }',

    // unknown map values
    'declare const map: any; map.set("a", map.get("a") ?? 1);'
  ],

  invalid: [
    {
      code: 'declare const map: Map<string, number[]>; map.set("a", map.get("a") ?? []);',
      output:
        'declare const map: Map<string, number[]>; map.getOrInsert("a", []);',
      errors: [
        {
          messageId: 'preferGetOrInsert',
          line: 1,
          column: 43,
          endLine: 1,
          endColumn: 75
        }
      ]
    },
    // set of a nullable map with a `has` check
    {
      code: 'declare const map: Map<string, number | undefined>; map.set("a", map.has("a") ? map.get("a") : 1);',
      output:
        'declare const map: Map<string, number | undefined>; map.getOrInsert("a", 1);',
      errors: [
        {
          messageId: 'preferGetOrInsert',
          line: 1,
          column: 53,
          endLine: 1,
          endColumn: 98
        }
      ]
    },
    // set of a non-nullable map with a default
    {
      code: 'declare const map: Map<string, number[]>; const v = map.get("a") ?? []; map.set("a", v);',
      output:
        'declare const map: Map<string, number[]>; const v = map.getOrInsert("a", []);',
      errors: [
        {
          messageId: 'preferGetOrInsert',
          line: 1,
          column: 53,
          endLine: 1,
          endColumn: 71
        }
      ]
    },
    // set of a non-nullable map with an if
    {
      code: 'declare const map: Map<string, number[]>; let v = map.get("a"); if (!v) { v = []; map.set("a", v); }',
      output:
        'declare const map: Map<string, number[]>; let v = map.getOrInsert("a", []);',
      errors: [
        {
          messageId: 'preferGetOrInsert',
          line: 1,
          column: 65,
          endLine: 1,
          endColumn: 101
        }
      ]
    }
  ]
});
