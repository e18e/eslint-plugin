import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import {isArrayType, isStringType} from '../utils/typescript.js';

type MessageIds = 'preferAt';

export const preferArrayAt: TSESLint.RuleModule<MessageIds, []> = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer Array.prototype.at() over length-based indexing'
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferAt: 'Use .at(-1) instead of [{{array}}.length - 1]'
    }
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      MemberExpression(node: TSESTree.MemberExpression) {
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

        const parent = node.parent;
        if (
          parent &&
          parent.type === 'AssignmentExpression' &&
          parent.left === node
        ) {
          return;
        }

        // Check if the object supports .at() (array or string, when types are available)
        if (
          !isArrayType(node.object, context) &&
          !isStringType(node.object, context)
        ) {
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
