import type {ESLint} from 'eslint';
import {recommended} from './configs/recommended.js';

const plugin: ESLint.Plugin = {
  meta: {
    name: '@e18e/eslint-plugin',
    namespace: 'e18e'
  },
  configs: {},
  rules: {}
};

plugin.configs!.recommended = recommended(plugin);

export default plugin;
