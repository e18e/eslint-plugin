import type {Rule} from 'eslint';
import type {
  BinaryExpression,
  BinaryOperator,
  CallExpression,
  Expression,
  Literal,
  Identifier,
  PrivateIdentifier,
  MemberExpression,
  Node,
  UnaryExpression
} from 'estree';
import {isInBooleanContext, isNullish} from '../utils/ast.js';

function isIdentifierOrStringLiteral(
  identifierName: string,
  node: Expression | PrivateIdentifier
): node is Identifier | Literal {
  return (
    (node.type === 'Identifier' && node.name === identifierName) ||
    (node.type === 'Literal' && node.value === identifierName)
  );
}

function isArrayMethodCall(
  methodName: string
): (node: Expression) => node is CallExpression {
  return function (node: Expression): node is CallExpression {
    return (
      node.type === 'CallExpression' &&
      node.callee.type === 'MemberExpression' &&
      isIdentifierOrStringLiteral(methodName, node.callee.property) &&
      node.arguments.length >= 1
    );
  };
}

const isFindCall = isArrayMethodCall('find');
const isFilterCall = isArrayMethodCall('filter');

function isFilterLengthCall(node: Expression): node is MemberExpression {
  return (
    node.type === 'MemberExpression' &&
    isIdentifierOrStringLiteral('length', node.property) &&
    node.object.type === 'CallExpression' &&
    isFilterCall(node.object)
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

function reportFilterLength(
  context: Rule.RuleContext,
  node: Node,
  filterLengthCall: MemberExpression,
  shouldNegate: boolean
) {
  if (filterLengthCall.object.type !== 'CallExpression') {
    return;
  }
  if (filterLengthCall.object.callee.type !== 'MemberExpression') {
    return;
  }

  const sourceCode = context.sourceCode;
  const arrayText = sourceCode.getText(filterLengthCall.object.callee.object);
  const argsText = filterLengthCall.object.arguments
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

  let findCall: CallExpression | undefined;
  let filterLengthCall: MemberExpression | undefined;
  let constantSide: Expression;

  if (isFindCall(left)) {
    findCall = left;
    constantSide = right;
  } else if (isFindCall(right)) {
    findCall = right;
    constantSide = left;
  } else if (isFilterLengthCall(left)) {
    filterLengthCall = left;
    constantSide = right;
  } else if (isFilterLengthCall(right)) {
    filterLengthCall = right;
    constantSide = left;
  } else {
    return;
  }

  if (findCall !== undefined) {
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
  } else if (filterLengthCall !== undefined) {
    // Map the operator direction to effectively be filterLengthSide <op> constantSide
    let ltrOperator = operator;
    if (left === constantSide) {
      ltrOperator =
        (
          {
            '>': '<',
            '<': '>',
            '<=': '>=',
            '>=': '<='
          } as Partial<Record<BinaryOperator, BinaryOperator>>
        )[operator] ?? operator;
    }

    if (constantSide.type === 'Literal' && constantSide.value === 0) {
      if (ltrOperator === '===' || ltrOperator === '<=') {
        reportFilterLength(context, node, filterLengthCall, true);
      } else if (ltrOperator === '!==' || ltrOperator === '>') {
        reportFilterLength(context, node, filterLengthCall, false);
      }
    } else if (constantSide.type === 'Literal' && constantSide.value === 1) {
      if (ltrOperator === '<') {
        reportFilterLength(context, node, filterLengthCall, true);
      } else if (ltrOperator === '>=') {
        reportFilterLength(context, node, filterLengthCall, false);
      }
    }
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

  // !arr.filter(fn).length -> !array.some(fn)
  if (node.operator === '!' && isFilterLengthCall(node.argument)) {
    reportFilterLength(context, node, node.argument, true);
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

  // !!arr.filter(fn).length -> arr.some(fn)
  if (
    node.operator === '!' &&
    node.argument.type === 'UnaryExpression' &&
    node.argument.operator === '!' &&
    isFilterLengthCall(node.argument.argument)
  ) {
    reportFilterLength(context, node, node.argument.argument, false);
  }
}

export const preferArraySome: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Array.some() over Array.find() and Array.filter().length checks when checking for element existence',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferArraySome:
        'Use Array.some() instead of Array.find() and Array.filter().length checks when checking for element existence'
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
      },
      MemberExpression(node: MemberExpression & Rule.NodeParentExtension) {
        // Skip if handled by UnaryExpression or BinaryExpression
        if (
          node.parent?.type === 'UnaryExpression' ||
          node.parent?.type === 'BinaryExpression'
        ) {
          return;
        }

        if (!isFilterLengthCall(node)) {
          return;
        }

        if (isInBooleanContext(node)) {
          reportFilterLength(context, node, node, false);
        }
      }
    };
  }
};
