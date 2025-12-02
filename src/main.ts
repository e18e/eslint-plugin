import type {ESLint} from 'eslint';
import {recommended} from './configs/recommended.js';
import {preferArrayAt} from './rules/prefer-array-at.js';
import {preferArrayFill} from './rules/prefer-array-fill.js';
import {preferArrayIncludes} from './rules/prefer-array-includes.js';

const plugin: ESLint.Plugin = {
  meta: {
    name: '@e18e/eslint-plugin',
    namespace: 'e18e'
  },
  configs: {},
  rules: {
    'prefer-array-at': preferArrayAt,
    'prefer-array-fill': preferArrayFill,
    'prefer-array-includes': preferArrayIncludes
  }
};

plugin.configs!.recommended = recommended(plugin);

export default plugin;
