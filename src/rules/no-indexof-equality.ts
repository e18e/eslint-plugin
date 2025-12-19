import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import {getTypedParserServices} from '../utils/typescript.js';

type MessageIds = 'preferDirectAccess' | 'preferStartsWith';

export const noIndexOfEquality: TSESLint.RuleModule<MessageIds, []> = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer optimized alternatives to `indexOf()` equality checks'
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferDirectAccess:
        'Use direct array access `{{array}}[{{index}}] === {{item}}` instead of `indexOf() === {{index}}`',
      preferStartsWith:
        'Use `.startsWith()` instead of `indexOf() === 0` for strings'
    }
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const services = getTypedParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      BinaryExpression(node: TSESTree.BinaryExpression) {
        if (node.operator !== '===' && node.operator !== '==') {
          return;
        }

        let indexOfCall: TSESTree.CallExpression | undefined;
        let compareIndex: number | undefined;

        if (
          node.left.type === 'CallExpression' &&
          node.right.type === 'Literal' &&
          typeof node.right.value === 'number' &&
          node.right.value >= 0
        ) {
          indexOfCall = node.left;
          compareIndex = node.right.value;
        } else if (
          node.right.type === 'CallExpression' &&
          node.left.type === 'Literal' &&
          typeof node.left.value === 'number' &&
          node.left.value >= 0
        ) {
          indexOfCall = node.right;
          compareIndex = node.left.value;
        }

        if (!indexOfCall || compareIndex === undefined) {
          return;
        }

        if (
          indexOfCall.callee.type !== 'MemberExpression' ||
          indexOfCall.callee.property.type !== 'Identifier' ||
          indexOfCall.callee.property.name !== 'indexOf'
        ) {
          return;
        }

        if (indexOfCall.arguments.length !== 1) {
          return;
        }

        const objectNode = indexOfCall.callee.object;
        const searchArg = indexOfCall.arguments[0];
        const type = services.getTypeAtLocation(objectNode as TSESTree.Node);

        if (!type) {
          return;
        }

        const objectText = sourceCode.getText(objectNode);
        const searchText = sourceCode.getText(searchArg);
        const stringType = checker.getStringType();

        if (checker.isTypeAssignableTo(type, stringType)) {
          if (compareIndex === 0) {
            context.report({
              node,
              messageId: 'preferStartsWith',
              fix(fixer) {
                return fixer.replaceText(
                  node,
                  `${objectText}.startsWith(${searchText})`
                );
              }
            });
          }
          return;
        }

        if (checker.isArrayType(type)) {
          context.report({
            node,
            messageId: 'preferDirectAccess',
            data: {
              array: objectText,
              item: searchText,
              index: String(compareIndex)
            },
            fix(fixer) {
              return fixer.replaceText(
                node,
                `${objectText}[${compareIndex}] === ${searchText}`
              );
            }
          });
        }
      }
    };
  }
};
