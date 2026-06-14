import {RuleTester} from 'eslint';
import {preferGetOrInsert} from './prefer-get-or-insert.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-get-or-insert', preferGetOrInsert, {
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
