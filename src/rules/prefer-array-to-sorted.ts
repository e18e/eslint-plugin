import type {Rule} from 'eslint';
import type {CallExpression} from 'estree';
import {getArrayFromCopyPattern, formatArguments} from '../utils/ast.js';

export const preferArrayToSorted: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Array.prototype.toSorted() over copying and sorting arrays',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferToSorted: 'Use {{array}}.toSorted() instead of copying and sorting'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: CallExpression) {
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
          const arrayText = sourceCode.getText(arrayNode);
          const argsText = formatArguments(node.arguments, sourceCode);

          context.report({
            node,
            messageId: 'preferToSorted',
            data: {
              array: arrayText
            },
            fix(fixer) {
              return fixer.replaceText(
                node,
                `${arrayText}.toSorted(${argsText})`
              );
            }
          });
        }
      }
    };
  }
};
