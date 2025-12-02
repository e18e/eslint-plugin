import type {Linter, ESLint} from 'eslint';

export const performanceImprovements = (
  plugin: ESLint.Plugin
): Linter.Config => ({
  plugins: {
    e18e: plugin
  },
  rules: {}
});
