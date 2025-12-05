import type {Rule, SourceCode} from 'eslint';
import type {
  ConditionalExpression,
  Expression,
  IfStatement,
  ExpressionStatement,
  AssignmentExpression,
  BlockStatement
} from 'estree';

function areExpressionsEquivalent(
  sourceCode: SourceCode,
  expr1: Expression,
  expr2: Expression
): boolean {
  return sourceCode.getText(expr1) === sourceCode.getText(expr2);
}

function isNullLiteral(node: Expression): boolean {
  return node.type === 'Literal' && node.value === null;
}

function isUndefinedIdentifier(node: Expression): boolean {
  return node.type === 'Identifier' && node.name === 'undefined';
}

type NullishCheckResult = {
  value: Expression;
  checksForNullish: boolean;
};

function isNullishCheck(
  sourceCode: SourceCode,
  expr: Expression
): NullishCheckResult | null {
  if (
    expr.type === 'BinaryExpression' &&
    expr.left.type !== 'PrivateIdentifier' &&
    isNullLiteral(expr.right) &&
    (expr.operator === '==' || expr.operator === '!=')
  ) {
    return {value: expr.left, checksForNullish: expr.operator === '=='};
  }

  if (
    expr.type === 'LogicalExpression' &&
    expr.left.type === 'BinaryExpression' &&
    expr.right.type === 'BinaryExpression' &&
    expr.left.left.type !== 'PrivateIdentifier' &&
    expr.right.left.type !== 'PrivateIdentifier'
  ) {
    const leftOp = expr.left.operator;
    const rightOp = expr.right.operator;
    const leftRight = expr.left.right;
    const rightRight = expr.right.right;
    const leftLeft = expr.left.left;
    const rightLeft = expr.right.left;

    const leftIsNull = isNullLiteral(leftRight);
    const leftIsUndefined = isUndefinedIdentifier(leftRight);
    const rightIsNull = isNullLiteral(rightRight);
    const rightIsUndefined = isUndefinedIdentifier(rightRight);

    if (!areExpressionsEquivalent(sourceCode, leftLeft, rightLeft)) {
      return null;
    }

    if (
      !((leftIsNull && rightIsUndefined) || (leftIsUndefined && rightIsNull))
    ) {
      return null;
    }

    // value === null || value === undefined
    if (expr.operator === '||' && leftOp === '===' && rightOp === '===') {
      return {value: leftLeft, checksForNullish: true};
    }

    // value !== null && value !== undefined
    if (expr.operator === '&&' && leftOp === '!==' && rightOp === '!==') {
      return {value: leftLeft, checksForNullish: false};
    }
  }

  return null;
}

export const preferNullishCoalescing: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer nullish coalescing operator (?? and ??=) over verbose null checks',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferNullishCoalescing:
        'Use nullish coalescing operator (??) instead of verbose null check',
      preferNullishCoalescingAssignment:
        'Use nullish coalescing assignment (??=) instead of verbose null check'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      ConditionalExpression(node: ConditionalExpression) {
        const checkResult = isNullishCheck(sourceCode, node.test);

        if (checkResult) {
          const {value, checksForNullish} = checkResult;

          if (checksForNullish) {
            // value == null ? default : value
            if (areExpressionsEquivalent(sourceCode, value, node.alternate)) {
              context.report({
                node,
                messageId: 'preferNullishCoalescing',
                fix(fixer) {
                  const valueText = sourceCode.getText(value);
                  const defaultText = sourceCode.getText(node.consequent);
                  return fixer.replaceText(
                    node,
                    `${valueText} ?? ${defaultText}`
                  );
                }
              });
            }
          } else {
            // value != null ? value : default
            if (areExpressionsEquivalent(sourceCode, value, node.consequent)) {
              context.report({
                node,
                messageId: 'preferNullishCoalescing',
                fix(fixer) {
                  const valueText = sourceCode.getText(value);
                  const defaultText = sourceCode.getText(node.alternate);
                  return fixer.replaceText(
                    node,
                    `${valueText} ?? ${defaultText}`
                  );
                }
              });
            }
          }
        }
      },

      IfStatement(node: IfStatement) {
        if (node.alternate) {
          return;
        }

        let body: ExpressionStatement | null = null;
        if (node.consequent.type === 'BlockStatement') {
          const blockStmt = node.consequent as BlockStatement;
          if (blockStmt.body.length !== 1) {
            return;
          }
          if (blockStmt.body[0]?.type === 'ExpressionStatement') {
            body = blockStmt.body[0];
          }
        } else if (node.consequent.type === 'ExpressionStatement') {
          body = node.consequent;
        }

        if (!body || body.expression.type !== 'AssignmentExpression') {
          return;
        }

        const assignment = body.expression as AssignmentExpression;
        if (assignment.operator !== '=') {
          return;
        }

        if (
          assignment.left.type !== 'Identifier' &&
          assignment.left.type !== 'MemberExpression'
        ) {
          return;
        }

        const checkResult = isNullishCheck(sourceCode, node.test);

        if (
          checkResult &&
          checkResult.checksForNullish &&
          areExpressionsEquivalent(
            sourceCode,
            checkResult.value,
            assignment.left
          )
        ) {
          context.report({
            node,
            messageId: 'preferNullishCoalescingAssignment',
            fix(fixer) {
              const leftText = sourceCode.getText(assignment.left);
              const rightText = sourceCode.getText(assignment.right);
              return fixer.replaceText(node, `${leftText} ??= ${rightText}`);
            }
          });
        }
      }
    };
  }
};
