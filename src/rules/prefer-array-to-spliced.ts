import type {Rule} from 'eslint';
import type {CallExpression} from 'estree';
import {getArrayFromCopyPattern, formatArguments} from '../utils/ast.js';

export const preferArrayToSpliced: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Array.prototype.toSpliced() over copying and splicing arrays',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferToSpliced:
        'Use {{array}}.toSpliced() instead of copying and splicing'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: CallExpression) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier' ||
          node.callee.property.name !== 'splice'
        ) {
          return;
        }

        const spliceCallee = node.callee.object;
        const arrayNode = getArrayFromCopyPattern(spliceCallee);

        if (arrayNode) {
          const arrayText = sourceCode.getText(arrayNode);
          const argsText = formatArguments(node.arguments, sourceCode);

          context.report({
            node,
            messageId: 'preferToSpliced',
            data: {
              array: arrayText
            },
            fix(fixer) {
              return fixer.replaceText(
                node,
                `${arrayText}.toSpliced(${argsText})`
              );
            }
          });
        }
      }
    };
  }
};
