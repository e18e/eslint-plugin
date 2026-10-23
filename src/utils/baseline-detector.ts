import type * as BaselineDetector from 'baseline-detector';

export type BaselineDetectorModule = typeof BaselineDetector;

let baselineDetector: BaselineDetectorModule | undefined;

export function setBaselineDetector(detector: BaselineDetectorModule): void {
  baselineDetector = detector;
}

export function getBaselineDetector(): BaselineDetectorModule {
  if (!baselineDetector) {
    throw new Error(
      'baseline-detector has not been initialised. Import the plugin from "@e18e/eslint-plugin/baseline" to use the Baseline rules.'
    );
  }
  return baselineDetector;
}
