import type {ESLint} from 'eslint';
import {recommended} from './configs/recommended.js';
import {preferArrayAt} from './rules/prefer-array-at.js';

const plugin: ESLint.Plugin = {
  meta: {
    name: '@e18e/eslint-plugin',
    namespace: 'e18e'
  },
  configs: {},
  rules: {
    'prefer-array-at': preferArrayAt
  }
};

plugin.configs!.recommended = recommended(plugin);

export default plugin;
