import type {Linter, ESLint} from 'eslint';
import {modernization} from './modernization.js';
import {moduleReplacements} from './module-replacements.js';
import {performanceImprovements} from './performance-improvements.js';

export const recommended = (plugin: ESLint.Plugin): Linter.Config => {
  const modernizationConfig = modernization(plugin);
  const moduleReplacementsConfig = moduleReplacements(plugin);
  const performanceImprovementsConfig = performanceImprovements(plugin);

  return {
    plugins: {
      e18e: plugin
    },
    rules: {
      ...modernizationConfig.rules,
      ...moduleReplacementsConfig.rules,
      ...performanceImprovementsConfig.rules
    }
  };
};
