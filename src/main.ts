import type {ESLint, Rule} from 'eslint';
import {recommended} from './configs/recommended.js';
import {modernization} from './configs/modernization.js';
import {moduleReplacements} from './configs/module-replacements.js';
import {performanceImprovements} from './configs/performance-improvements.js';
import {preferArrayAt} from './rules/prefer-array-at.js';
import {preferArrayFill} from './rules/prefer-array-fill.js';
import {preferArrayFromMap} from './rules/prefer-array-from-map.js';
import {preferIncludes} from './rules/prefer-includes.js';
import {preferArrayToReversed} from './rules/prefer-array-to-reversed.js';
import {preferArrayToSorted} from './rules/prefer-array-to-sorted.js';
import {preferArrayToSpliced} from './rules/prefer-array-to-spliced.js';
import {preferExponentiationOperator} from './rules/prefer-exponentiation-operator.js';
import {preferNullishCoalescing} from './rules/prefer-nullish-coalescing.js';
import {preferObjectHasOwn} from './rules/prefer-object-has-own.js';
import {preferSpreadSyntax} from './rules/prefer-spread-syntax.js';
import {preferUrlCanParse} from './rules/prefer-url-canparse.js';
import {noIndexOfEquality} from './rules/no-indexof-equality.js';
import {preferTimerArgs} from './rules/prefer-timer-args.js';
import {preferDateNow} from './rules/prefer-date-now.js';
import {preferRegexTest} from './rules/prefer-regex-test.js';
import {preferArraySome} from './rules/prefer-array-some.js';
import {rules as dependRules} from 'eslint-plugin-depend';

const plugin: ESLint.Plugin = {
  meta: {
    name: 'e18e',
    namespace: 'e18e'
  },
  configs: {},
  rules: {
    'prefer-array-at': preferArrayAt as never as Rule.RuleModule,
    'prefer-array-fill': preferArrayFill,
    'prefer-array-from-map': preferArrayFromMap,
    'prefer-includes': preferIncludes,
    'prefer-array-to-reversed': preferArrayToReversed,
    'prefer-array-to-sorted': preferArrayToSorted as never as Rule.RuleModule,
    'prefer-array-to-spliced': preferArrayToSpliced,
    'prefer-exponentiation-operator': preferExponentiationOperator,
    'prefer-nullish-coalescing': preferNullishCoalescing,
    'prefer-object-has-own': preferObjectHasOwn,
    'prefer-spread-syntax': preferSpreadSyntax,
    'prefer-url-canparse': preferUrlCanParse,
    'no-indexof-equality': noIndexOfEquality as never as Rule.RuleModule,
    'prefer-timer-args': preferTimerArgs,
    'prefer-date-now': preferDateNow,
    'prefer-regex-test': preferRegexTest as never as Rule.RuleModule,
    'prefer-array-some': preferArraySome,
    ...dependRules
  }
};

plugin.configs!.recommended = recommended(plugin);
plugin.configs!.modernization = modernization(plugin);
plugin.configs!.moduleReplacements = moduleReplacements(plugin);
plugin.configs!.performanceImprovements = performanceImprovements(plugin);

export default plugin;
