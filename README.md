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
      'e18e/prefer-array-includes': 'error'
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
| [prefer-array-includes](./src/rules/prefer-array-includes.ts) | Prefer `Array.prototype.includes()` over `indexOf()` comparisons | ✅ | ✅ |

### Module replacements

| Rule | Description | Recommended | Fixable |
|------|-------------|-------------|---------|
| ban-dependencies | Ban dependencies in favor of lighter alternatives | ✅ | ❌ |

### Performance improvements

_No rules in this category yet._

## License

MIT
