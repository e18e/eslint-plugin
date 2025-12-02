import type {Rule} from 'eslint';
import type {
  BinaryExpression,
  CallExpression,
  UnaryExpression,
  Expression
} from 'estree';

function isIndexOfCall(node: Expression): node is CallExpression {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'indexOf' &&
    node.arguments.length >= 1
  );
}

function isNegativeOne(node: Expression): boolean {
  return (
    node.type === 'UnaryExpression' &&
    node.operator === '-' &&
    node.argument.type === 'Literal' &&
    node.argument.value === 1
  );
}

function isZero(node: Expression): boolean {
  return node.type === 'Literal' && node.value === 0;
}

function reportIndexOf(
  context: Rule.RuleContext,
  node: BinaryExpression | UnaryExpression,
  indexOfCall: CallExpression,
  shouldNegate: boolean
) {
  const sourceCode = context.sourceCode;
  const arrayText = sourceCode.getText(
    indexOfCall.callee.type === 'MemberExpression'
      ? indexOfCall.callee.object
      : indexOfCall.callee
  );

  const argsText = indexOfCall.arguments
    .map((arg) => sourceCode.getText(arg))
    .join(', ');

  const replacement = shouldNegate
    ? `!${arrayText}.includes(${argsText})`
    : `${arrayText}.includes(${argsText})`;

  context.report({
    node,
    messageId: 'preferIncludes',
    fix(fixer) {
      return fixer.replaceText(node, replacement);
    }
  });
}

function checkBinaryExpression(
  node: BinaryExpression,
  context: Rule.RuleContext
) {
  const {left, right, operator} = node;

  if (left.type === 'PrivateIdentifier') {
    return;
  }

  let indexOfCall: CallExpression;
  let constantSide: Expression;
  let op = operator;

  if (isIndexOfCall(left)) {
    indexOfCall = left;
    constantSide = right;
  } else if (isIndexOfCall(right)) {
    indexOfCall = right;
    constantSide = left;
    if (operator === '<') {
      op = '>';
    } else if (operator === '>') {
      op = '<';
    } else if (operator === '<=') {
      op = '>=';
    } else if (operator === '>=') {
      op = '<=';
    }
  } else {
    return;
  }

  if (isNegativeOne(constantSide)) {
    if (op === '!==' || op === '!=' || op === '>') {
      reportIndexOf(context, node, indexOfCall, false);
      return;
    }
    if (op === '===' || op === '==') {
      reportIndexOf(context, node, indexOfCall, true);
      return;
    }
  }

  if (isZero(constantSide)) {
    if (op === '>=') {
      reportIndexOf(context, node, indexOfCall, false);
      return;
    }
    if (op === '<') {
      reportIndexOf(context, node, indexOfCall, true);
      return;
    }
  }
}

function checkUnaryExpression(
  node: UnaryExpression,
  context: Rule.RuleContext
) {
  if (node.operator === '~' && isIndexOfCall(node.argument)) {
    reportIndexOf(context, node, node.argument, false);
    return;
  }

  if (
    node.operator === '!' &&
    node.argument.type === 'UnaryExpression' &&
    node.argument.operator === '~' &&
    isIndexOfCall(node.argument.argument)
  ) {
    reportIndexOf(context, node, node.argument.argument, true);
    return;
  }
}

export const preferIncludes: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer .includes() over indexOf() comparisons for arrays and strings',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferIncludes: 'Use .includes() instead of indexOf() comparison'
    }
  },
  create(context) {
    return {
      BinaryExpression(node: BinaryExpression) {
        checkBinaryExpression(node, context);
      },
      UnaryExpression(node: UnaryExpression & Rule.NodeParentExtension) {
        // Skip ~ if it's inside !~ (the parent will handle it)
        if (node.operator === '~' && node.parent) {
          if (
            node.parent.type === 'UnaryExpression' &&
            node.parent.operator === '!'
          ) {
            return;
          }
        }

        checkUnaryExpression(node, context);
      }
    };
  }
};
