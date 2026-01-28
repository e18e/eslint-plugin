import type {Rule} from 'eslint';
import type {
  BinaryExpression,
  CallExpression,
  UnaryExpression,
  Expression,
  Node
} from 'estree';
import {isInBooleanContext, isNullish} from '../utils/ast.js';

function isFindCall(node: Expression): node is CallExpression {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'find' &&
    node.arguments.length >= 1
  );
}

function reportFind(
  context: Rule.RuleContext,
  node: Node,
  findCall: CallExpression,
  shouldNegate: boolean
) {
  if (findCall.callee.type !== 'MemberExpression') {
    return;
  }

  const sourceCode = context.sourceCode;
  const arrayText = sourceCode.getText(findCall.callee.object);
  const argsText = findCall.arguments
    .map((arg) => sourceCode.getText(arg))
    .join(', ');

  const replacement = shouldNegate
    ? `!${arrayText}.some(${argsText})`
    : `${arrayText}.some(${argsText})`;

  context.report({
    node,
    messageId: 'preferArraySome',
    fix(fixer) {
      return fixer.replaceText(node, replacement);
    }
  });
}

function checkBinaryExpression(
  node: BinaryExpression & Rule.NodeParentExtension,
  context: Rule.RuleContext
) {
  const {left, right, operator} = node;

  if (left.type === 'PrivateIdentifier') {
    return;
  }

  let findCall: CallExpression;
  let constantSide: Expression;

  if (isFindCall(left)) {
    findCall = left;
    constantSide = right;
  } else if (isFindCall(right)) {
    findCall = right;
    constantSide = left;
  } else {
    return;
  }

  const nullishType = isNullish(constantSide);
  if (!nullishType) {
    return;
  }

  if (operator === '===' || operator === '!==') {
    if (nullishType !== 'undefined') {
      return;
    }
    const shouldNegate = operator === '===';
    reportFind(context, node, findCall, shouldNegate);
    return;
  }
}

function checkUnaryExpression(
  node: UnaryExpression & Rule.NodeParentExtension,
  context: Rule.RuleContext
) {
  // !arr.find(fn) -> !arr.some(fn)
  if (node.operator === '!' && isFindCall(node.argument)) {
    reportFind(context, node, node.argument, true);
    return;
  }

  // !!arr.find(fn) -> arr.some(fn)
  if (
    node.operator === '!' &&
    node.argument.type === 'UnaryExpression' &&
    node.argument.operator === '!' &&
    isFindCall(node.argument.argument)
  ) {
    reportFind(context, node, node.argument.argument, false);
    return;
  }
}

export const preferArraySome: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Array.some() over Array.find() when checking for element existence',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferArraySome:
        'Use Array.some() instead of Array.find() when checking for element existence'
    }
  },
  create(context) {
    return {
      BinaryExpression(node: BinaryExpression & Rule.NodeParentExtension) {
        checkBinaryExpression(node, context);
      },
      UnaryExpression(node: UnaryExpression & Rule.NodeParentExtension) {
        // Skip inner ! if it's inside !! (the outer will handle it)
        if (node.operator === '!' && node.parent) {
          if (
            node.parent.type === 'UnaryExpression' &&
            node.parent.operator === '!'
          ) {
            return;
          }
        }

        checkUnaryExpression(node, context);
      },
      CallExpression(node: CallExpression & Rule.NodeParentExtension) {
        // Skip if handled by UnaryExpression or BinaryExpression
        if (
          node.parent?.type === 'UnaryExpression' ||
          node.parent?.type === 'BinaryExpression'
        ) {
          return;
        }

        if (!isFindCall(node)) {
          return;
        }

        if (isInBooleanContext(node)) {
          reportFind(context, node, node, false);
        }
      }
    };
  }
};
