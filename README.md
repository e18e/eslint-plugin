# @e18e/eslint-plugin

> The official e18e ESLint plugin for modernizing JavaScript/TypeScript code and improving performance.

> [!WARNING]
> This is an experimental, unpublished project for now. Once we have settled on the scope, we will publish it and announce it to start getting community feedback.

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

## Rules

### Modernization

| Rule | Description | Recommended | Fixable |
|------|-------------|-------------|---------|
| [prefer-array-at](./src/rules/prefer-array-at.ts) | Prefer `Array.prototype.at()` over length-based indexing | ✅ | ✅ |
| [prefer-array-fill](./src/rules/prefer-array-fill.ts) | Prefer `Array.prototype.fill()` over `Array.from()` or `map()` with constant values | ✅ | ✅ |
| [prefer-includes](./src/rules/prefer-includes.ts) | Prefer `.includes()` over `indexOf()` comparisons for arrays and strings | ✅ | ✅ |
| [prefer-array-to-reversed](./src/rules/prefer-array-to-reversed.ts) | Prefer `Array.prototype.toReversed()` over copying and reversing arrays | ✅ | ✅ |
| [prefer-array-to-sorted](./src/rules/prefer-array-to-sorted.ts) | Prefer `Array.prototype.toSorted()` over copying and sorting arrays | ✅ | ✅ |
| [prefer-array-to-spliced](./src/rules/prefer-array-to-spliced.ts) | Prefer `Array.prototype.toSpliced()` over copying and splicing arrays | ✅ | ✅ |
| [prefer-exponentiation-operator](./src/rules/prefer-exponentiation-operator.ts) | Prefer the exponentiation operator `**` over `Math.pow()` | ✅ | ✅ |
| [prefer-nullish-coalescing](./src/rules/prefer-nullish-coalescing.ts) | Prefer nullish coalescing operator (`??` and `??=`) over verbose null checks | ✅ | ✅ |
| [prefer-object-has-own](./src/rules/prefer-object-has-own.ts) | Prefer `Object.hasOwn()` over `Object.prototype.hasOwnProperty.call()` and `obj.hasOwnProperty()` | ✅ | ✅ |
| [prefer-spread-syntax](./src/rules/prefer-spread-syntax.ts) | Prefer spread syntax over `Array.concat()`, `Object.assign({}, ...)`, and `Function.apply()` | ✅ | ✅ |
| [prefer-url-canparse](./src/rules/prefer-url-canparse.ts) | Prefer `URL.canParse()` over try-catch blocks for URL validation | ✅ | 💡 |

**Fixable Legend:**
- ✅ = Auto-fixable (changes applied automatically)
- 💡 = Has suggestions (requires user confirmation)
- ❌ = Not fixable

### Module replacements

| Rule | Description | Recommended | Fixable |
|------|-------------|-------------|---------|
| ban-dependencies | Ban dependencies in favor of lighter alternatives | ✅ | ❌ |

### Performance improvements

_No rules in this category yet._

## License

MIT
