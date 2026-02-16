# @e18e/eslint-plugin

> The official e18e ESLint plugin for modernizing JavaScript/TypeScript code and improving performance.

This plugin focuses on applying the e18e community's best practices and advise to JavaScript/TypeScript codebases.

## Overview

There are a few categories of rules in this plugin:

- Modernization - New syntax and APIs which improve code readability and performance
- Module replacements - Community recommended alternatives to popular libraries, focused on performance and size
- Performance improvements - Patterns that can be optimized for better runtime performance

Each of these can be enabled individually, or you can use the recommended configuration to enable all rules.

## Installation

```bash
npm install --save-dev @e18e/eslint-plugin
```

## Usage

Add the plugin to your `eslint.config.js`:

```ts
import e18e from '@e18e/eslint-plugin';

export default [
  // Use the recommended configuration (includes all categories)
  e18e.configs.recommended,

  // Or use specific category configurations
  e18e.configs.modernization,
  e18e.configs.moduleReplacements,
  e18e.configs.performanceImprovements,

  // Or configure rules manually
  {
    plugins: {
      e18e
    },
    rules: {
      'e18e/prefer-array-at': 'error',
      'e18e/prefer-array-fill': 'error',
      'e18e/prefer-includes': 'error'
    }
  }
];
```

## Usage with oxlint

If you're using oxlint, you can enable the e18e plugin by adding it to your `.oxlintrc.json` file:

```json
{
  "jsPlugins": ["@e18e/eslint-plugin"],
  "rules": {
    "e18e/prefer-includes": "error"
  }
}
```

You can enable the recommended configuration by copying the rules from each of the ESLint configuration files into your `.oxlintrc.json` file.

- [modernization configuration](./src/configs/modernization.ts)
- [module replacements configuration](./src/configs/module-replacements.ts)
- [performance improvements configuration](./src/configs/performance-improvements.ts)

Copying these rules into your `rules` object will achieve the same effect as using the recommended configuration in ESLint.

> [!NOTE]
> Our type-aware rules depend on TypeScript ESLint's parser, which means they
> will not work with oxlint at this time.

## Linting `package.json`

Some rules (e.g. `ban-dependencies`) can be used against your `package.json`.

You can achieve this by using `@eslint/json` or `jsonc-eslint-parser`.

For example, with `@eslint/json` and `eslint.config.js`:

```ts
import e18e from '@e18e/eslint-plugin';
import json from '@eslint/json';
import {defineConfig} from 'eslint/config';

export default defineConfig([
  {
    files: ['package.json'],
    language: 'json/json',
    plugins: {
      e18e,
      json
    },
    extends: ['e18e/recommended'],
  }
]);
```

Or with `jsonc-eslint-parser` and `eslint.config.js`:

```ts
import e18e from '@e18e/eslint-plugin';
import jsonParser from 'jsonc-eslint-parser';
import {defineConfig} from 'eslint/config';

export default defineConfig([
  {
    files: ['package.json'],
    languageOptions: {
      parser: jsonParser
    },
    plugins: {
      e18e
    },
    extends: ['e18e/recommended'],
  }
]);
```

Read more at the
[`@eslint/json` docs](https://github.com/eslint/json) and
[`jsonc-eslint-parser` docs](https://github.com/ota-meshi/jsonc-eslint-parser).

## Rules

**Legend:**
- ✅ = Yes / Enabled
- ✖️ = No / Disabled
- 💡 = Has suggestions (requires user confirmation for fixes)
- 🔶 = Optionally uses types (works without TypeScript but more powerful with it)

### Modernization

| Rule | Description | Recommended | Fixable | Requires Types |
|------|-------------|-------------|---------|----------------|
| [prefer-array-at](./src/rules/prefer-array-at.ts) | Prefer `Array.prototype.at()` over length-based indexing | ✅ | ✅ | 🔶 |
| [prefer-array-fill](./src/rules/prefer-array-fill.ts) | Prefer `Array.prototype.fill()` over `Array.from()` or `map()` with constant values | ✅ | ✅ | ✖️ |
| [prefer-includes](./src/rules/prefer-includes.ts) | Prefer `.includes()` over `indexOf()` comparisons for arrays and strings | ✅ | ✅ | ✖️ |
| [prefer-array-to-reversed](./src/rules/prefer-array-to-reversed.ts) | Prefer `Array.prototype.toReversed()` over copying and reversing arrays | ✅ | ✅ | ✖️ |
| [prefer-array-to-sorted](./src/rules/prefer-array-to-sorted.ts) | Prefer `Array.prototype.toSorted()` over copying and sorting arrays | ✅ | ✅ | 🔶 |
| [prefer-array-to-spliced](./src/rules/prefer-array-to-spliced.ts) | Prefer `Array.prototype.toSpliced()` over copying and splicing arrays | ✅ | ✅ | ✖️ |
| [prefer-exponentiation-operator](./src/rules/prefer-exponentiation-operator.ts) | Prefer the exponentiation operator `**` over `Math.pow()` | ✅ | ✅ | ✖️ |
| [prefer-nullish-coalescing](./src/rules/prefer-nullish-coalescing.ts) | Prefer nullish coalescing operator (`??` and `??=`) over verbose null checks | ✅ | ✅ | ✖️ |
| [prefer-object-has-own](./src/rules/prefer-object-has-own.ts) | Prefer `Object.hasOwn()` over `Object.prototype.hasOwnProperty.call()` and `obj.hasOwnProperty()` | ✅ | ✅ | ✖️ |
| [prefer-spread-syntax](./src/rules/prefer-spread-syntax.ts) | Prefer spread syntax over `Array.concat()`, `Array.from()`, `Object.assign({}, ...)`, and `Function.apply()` | ✅ | ✅ | ✖️ |
| [prefer-url-canparse](./src/rules/prefer-url-canparse.ts) | Prefer `URL.canParse()` over try-catch blocks for URL validation | ✅ | 💡 | ✖️ |

### Module replacements

| Rule | Description | Recommended | Fixable | Requires Types |
|------|-------------|-------------|---------|----------------|
| ban-dependencies | Ban dependencies in favor of lighter alternatives | ✅ | ✖️ | ✖️ |

### Performance improvements

| Rule | Description | Recommended | Fixable | Requires Types |
|------|-------------|-------------|---------|----------------|
| [no-indexof-equality](./src/rules/no-indexof-equality.ts) | Prefer `startsWith()` for strings and direct array access over `indexOf()` equality checks | ✖️ | ✅ | ✅ |
| [prefer-array-from-map](./src/rules/prefer-array-from-map.ts) | Prefer `Array.from(iterable, mapper)` over `[...iterable].map(mapper)` to avoid intermediate array allocation | ✅ | ✅ | ✖️ |
| [prefer-array-some](./src/rules/prefer-array-some.ts) | Prefer `Array.some()` over `Array.find()` when checking for element existence | ✅ | ✅ | ✖️ |
| [prefer-timer-args](./src/rules/prefer-timer-args.ts) | Prefer passing function and arguments directly to `setTimeout`/`setInterval` instead of wrapping in an arrow function or using `bind` | ✅ | ✅ | ✖️ |
| [prefer-date-now](./src/rules/prefer-date-now.ts) | Prefer `Date.now()` over `new Date().getTime()` and `+new Date()` | ✅ | ✅ | ✖️ |
| [prefer-regex-test](./src/rules/prefer-regex-test.ts) | Prefer `RegExp.test()` over `String.match()` and `RegExp.exec()` when only checking for match existence | ✅ | ✅ | 🔶 |
| [prefer-static-regex](./src/rules/prefer-static-regex.ts) | Prefer defining regular expressions at module scope to avoid re-compilation on every function call | ✅ | ✖️ | ✖️ |

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/e18e">
    <img src="https://e18e.dev/sponsors.svg" alt="e18e community sponsors" />
  </a>
</p>

## License

MIT
