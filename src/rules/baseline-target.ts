import {createRequire} from 'node:module';
import path from 'node:path';
import type {TSESLint} from '@typescript-eslint/utils';
import {
  detectBaselineTargetForFeatures,
  detectBaselineYearForFeatures,
  detectFeaturesForSource
} from 'baseline-detector';
import {tryGetTypedParserServices} from '../utils/typescript.js';

type MessageIds = 'notBaseline' | 'exceedsYear';

const BASELINE_YEAR = 2023;

export const baselineTarget: TSESLint.RuleModule<MessageIds, []> = {
  meta: {
    type: 'problem',
    docs: {
      description: `Disallow features newer than Baseline ${BASELINE_YEAR}`
    },
    schema: [],
    messages: {
      notBaseline: '`{{feature}}` is not Baseline yet',
      exceedsYear:
        'This file needs Baseline {{year}}, above the {{floor}} floor'
    }
  },
  defaultOptions: [],
  create(context) {
    const services = tryGetTypedParserServices(context);

    return {
      Program(node) {
        const features = detectFeaturesForSource(context.sourceCode.text, {
          fileName: context.filename,
          ...(services && {
            typescriptContext: {
              ts: createRequire(path.join(context.cwd, 'package.json'))(
                'typescript'
              ),
              program: services.program,
              checker: services.program.getTypeChecker()
            }
          })
        });
        const target = detectBaselineTargetForFeatures(features);
        const year = detectBaselineYearForFeatures(features);
        // the order of the checks matters, a feature that is not baseline makes year come back null, and so does a file
        // with no features at all.
        if (target.status === false) {
          context.report({
            node,
            messageId: 'notBaseline',
            data: {feature: target.reason}
          });
          return;
        }

        if (year !== null && year > BASELINE_YEAR) {
          context.report({
            node,
            messageId: 'exceedsYear',
            data: {year, floor: BASELINE_YEAR}
          });
        }
      }
    };
  }
};
