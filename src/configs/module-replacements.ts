import type {Linter, ESLint} from 'eslint';

export const moduleReplacements = (plugin: ESLint.Plugin): Linter.Config => ({
  plugins: {
    e18e: plugin
  },
  rules: {
    'e18e/ban-dependencies': 'error'
  }
});
