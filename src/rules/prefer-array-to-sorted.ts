import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import {
  getArrayFromCopyPattern,
  formatArguments,
  needsParensForPropertyAccess,
  isCopyPatternOptional
} from '../utils/ast.js';
import {isArrayType} from '../utils/typescript.js';

type MessageIds = 'preferToSorted';

export const preferArrayToSorted: TSESLint.RuleModule<MessageIds, []> = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Array.prototype.toSorted() over copying and sorting arrays'
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferToSorted: 'Use {{array}}.toSorted() instead of copying and sorting'
    }
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier' ||
          node.callee.property.name !== 'sort'
        ) {
          return;
        }

        const sortCallee = node.callee.object;
        const arrayNode = getArrayFromCopyPattern(sortCallee);

        if (arrayNode) {
          if (!isArrayType(arrayNode, context)) {
            return;
          }

          const rawText = sourceCode.getText(arrayNode);
          const arrayText = needsParensForPropertyAccess(arrayNode)
            ? `(${rawText})`
            : rawText;
          const argsText = formatArguments(node.arguments, sourceCode);
          const optionalChain = isCopyPatternOptional(sortCallee) ? '?.' : '.';

          context.report({
            node,
            messageId: 'preferToSorted',
            data: {
              array: rawText
            },
            fix(fixer) {
              return fixer.replaceText(
                node,
                `${arrayText}${optionalChain}toSorted(${argsText})`
              );
            }
          });
        }
      }
    };
  }
};
