import type {Rule} from 'eslint';
import type {CallExpression} from 'estree';
import {
  getArrayFromCopyPattern,
  needsParensForPropertyAccess,
  isCopyPatternOptional
} from '../utils/ast.js';

export const preferArrayToReversed: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Array.prototype.toReversed() over copying and reversing arrays',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferToReversed:
        'Use {{array}}.toReversed() instead of copying and reversing'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: CallExpression) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier' ||
          node.callee.property.name !== 'reverse'
        ) {
          return;
        }

        const reverseCallee = node.callee.object;
        const arrayNode = getArrayFromCopyPattern(reverseCallee);

        if (arrayNode) {
          const rawText = sourceCode.getText(arrayNode);
          const arrayText = needsParensForPropertyAccess(arrayNode)
            ? `(${rawText})`
            : rawText;
          const optionalChain = isCopyPatternOptional(reverseCallee)
            ? '?.'
            : '.';

          context.report({
            node,
            messageId: 'preferToReversed',
            data: {
              array: rawText
            },
            fix(fixer) {
              return fixer.replaceText(
                node,
                `${arrayText}${optionalChain}toReversed()`
              );
            }
          });
        }
      }
    };
  }
};
