import type {Rule} from 'eslint';
import type {CallExpression} from 'estree';

export const preferArrayFromMap: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Array.from(iterable, mapper) over [...iterable].map(mapper) to avoid intermediate array allocation',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferArrayFrom:
        'Use Array.from({{iterable}}, {{mapper}}) instead of [...{{iterable}}].map({{mapper}}) to avoid creating an intermediate array'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: CallExpression) {
        // Check if this is a .map() call
        if (node.callee.type !== 'MemberExpression') {
          return;
        }

        if (
          node.callee.property.type !== 'Identifier' ||
          node.callee.property.name !== 'map'
        ) {
          return;
        }

        // Check if .map() is being called on an array literal with spread
        if (node.callee.object.type !== 'ArrayExpression') {
          return;
        }

        const arrayExpr = node.callee.object;

        // Check if the array has exactly one element and it's a spread element
        if (
          arrayExpr.elements.length !== 1 ||
          arrayExpr.elements[0]?.type !== 'SpreadElement'
        ) {
          return;
        }

        // Check if map has exactly one argument (the mapper function)
        if (node.arguments.length !== 1) {
          return;
        }

        const spreadElement = arrayExpr.elements[0];
        const iterableText = sourceCode.getText(spreadElement.argument);
        const mapperText = sourceCode.getText(node.arguments[0]!);

        context.report({
          node,
          messageId: 'preferArrayFrom',
          data: {
            iterable: iterableText,
            mapper: mapperText
          },
          fix(fixer) {
            return fixer.replaceText(
              node,
              `Array.from(${iterableText}, ${mapperText})`
            );
          }
        });
      }
    };
  }
};
