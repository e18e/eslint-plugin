import type {ESLint, Rule} from 'eslint';
import {baselineTarget} from '../rules/baseline-target.js';
import {
  setBaselineDetector,
  type BaselineDetectorModule
} from './baseline-detector.js';

export function initialiseBaseline(
  detector: BaselineDetectorModule,
  plugin: ESLint.Plugin
): void {
  setBaselineDetector(detector);
  plugin.rules!['baseline-target'] = baselineTarget as never as Rule.RuleModule;
}
