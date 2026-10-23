import type {Linter} from 'eslint';
import * as baselineDetector from 'baseline-detector';
import plugin from './main.js';
import {initialiseBaseline} from './utils/initialise-baseline.js';

initialiseBaseline(baselineDetector, plugin);

export const config: Linter.Config = {
  plugins: {e18e: plugin},
  rules: {'e18e/baseline-target': 'error'}
};

export default plugin;
