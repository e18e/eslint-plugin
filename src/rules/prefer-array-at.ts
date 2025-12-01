import type {Rule} from 'eslint';
import type {MemberExpression} from 'estree';

export const preferArrayAt: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer Array.prototype.at() over length-based indexing',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferAt: 'Use .at(-1) instead of [{{array}}.length - 1]'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      MemberExpression(node: MemberExpression) {
        if (!node.computed || !node.property) {
          return;
        }

        if (node.property.type !== 'BinaryExpression') {
          return;
        }

        const propertyExpr = node.property;

        if (propertyExpr.operator !== '-') {
          return;
        }

        if (
          propertyExpr.right.type !== 'Literal' ||
          propertyExpr.right.value !== 1
        ) {
          return;
        }

        if (propertyExpr.left.type !== 'MemberExpression') {
          return;
        }

        const leftMember = propertyExpr.left;

        if (
          leftMember.property.type !== 'Identifier' ||
          leftMember.property.name !== 'length'
        ) {
          return;
        }

        const arrayText = sourceCode.getText(node.object);
        const lengthArrayText = sourceCode.getText(leftMember.object);

        if (arrayText !== lengthArrayText) {
          return;
        }

        context.report({
          node,
          messageId: 'preferAt',
          data: {
            array: arrayText
          },
          fix(fixer) {
            return fixer.replaceText(node, `${arrayText}.at(-1)`);
          }
        });
      }
    };
  }
};
