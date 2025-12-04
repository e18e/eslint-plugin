import type {Rule, SourceCode} from 'eslint';
import type {
  TryStatement,
  BlockStatement,
  ExpressionStatement,
  NewExpression,
  ReturnStatement,
  Statement
} from 'estree';
import {formatArguments} from '../utils/ast.js';

/**
 * Check if a statement is `new URL(...)`
 */
function isNewURLStatement(
  stmt: Statement
): stmt is ExpressionStatement & {expression: NewExpression} {
  return (
    stmt.type === 'ExpressionStatement' &&
    stmt.expression.type === 'NewExpression' &&
    stmt.expression.callee.type === 'Identifier' &&
    stmt.expression.callee.name === 'URL' &&
    stmt.expression.arguments.length >= 1
  );
}

/**
 * Check if a statement is `return (true|false)`
 */
function isReturnBoolean(
  stmt: Statement,
  value: boolean
): stmt is ReturnStatement {
  return (
    stmt.type === 'ReturnStatement' &&
    stmt.argument?.type === 'Literal' &&
    stmt.argument.value === value
  );
}

/**
 * Check if block has only a return statement with a boolean literal
 */
function hasOnlyReturnBoolean(block: BlockStatement, value: boolean): boolean {
  if (block.body.length !== 1) {
    return false;
  }
  const firstStmt = block.body[0];
  if (!firstStmt) {
    return false;
  }
  return isReturnBoolean(firstStmt, value);
}

/**
 * Check if block is empty or contains only empty statements
 */
function isEmptyBlock(block: BlockStatement, sourceCode: SourceCode): boolean {
  return (
    block.body.length === 0 ||
    block.body.every(
      (stmt) =>
        stmt.type === 'EmptyStatement' || !sourceCode.getText(stmt).trim()
    )
  );
}

export const preferUrlCanParse: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer URL.canParse() over try-catch blocks for URL validation',
      recommended: true
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      preferCanParse:
        'Use URL.canParse() instead of try-catch for URL validation',
      replaceWithCanParse: 'Replace with URL.canParse()'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      TryStatement(node: TryStatement) {
        const tryBlock = node.block;
        const catchClause = node.handler;

        if (!catchClause) {
          return;
        }

        const tryStatements = tryBlock.body;
        if (tryStatements.length === 0) {
          return;
        }

        const firstStmt = tryStatements[0];

        if (!firstStmt || !isNewURLStatement(firstStmt)) {
          return;
        }

        const urlArgText = formatArguments(
          firstStmt.expression.arguments,
          sourceCode
        );

        // try { new URL(u); return true; } catch { return false; }
        const secondStmt = tryStatements[1];
        if (
          tryStatements.length === 2 &&
          secondStmt &&
          isReturnBoolean(secondStmt, true) &&
          hasOnlyReturnBoolean(catchClause.body, false)
        ) {
          context.report({
            node,
            messageId: 'preferCanParse',
            suggest: [
              {
                messageId: 'replaceWithCanParse',
                fix(fixer) {
                  return fixer.replaceText(
                    node,
                    `return URL.canParse(${urlArgText})`
                  );
                }
              }
            ]
          });
          return;
        }

        // try { new URL(u); ...body } catch { ...catchBody }
        // Basically if there's a body after the URL construction
        if (tryStatements.length >= 2) {
          const bodyAfterURL = tryStatements.slice(1);
          const firstBodyStmt = bodyAfterURL[0];
          const lastBodyStmt = bodyAfterURL.at(-1);

          const bodyText =
            firstBodyStmt &&
            lastBodyStmt &&
            firstBodyStmt.range &&
            lastBodyStmt.range
              ? sourceCode.text.slice(
                  firstBodyStmt.range[0],
                  lastBodyStmt.range[1]
                )
              : '';

          const catchBody = catchClause.body;
          const catchBodyEmpty = isEmptyBlock(catchBody, sourceCode);

          let replacement: string;
          if (catchBodyEmpty) {
            // No catch body, just if without else
            replacement = `if (URL.canParse(${urlArgText})) {\n${bodyText}\n}`;
          } else {
            const catchStatements = catchBody.body;
            const firstCatchStmt = catchStatements[0];
            const lastCatchStmt = catchStatements.at(-1);
            const catchBodyText =
              firstCatchStmt &&
              lastCatchStmt &&
              firstCatchStmt.range &&
              lastCatchStmt.range
                ? sourceCode.text.slice(
                    firstCatchStmt.range[0],
                    lastCatchStmt.range[1]
                  )
                : '';
            replacement = `if (URL.canParse(${urlArgText})) {\n${bodyText}\n} else {\n${catchBodyText}\n}`;
          }

          context.report({
            node,
            messageId: 'preferCanParse',
            suggest: [
              {
                messageId: 'replaceWithCanParse',
                fix(fixer) {
                  return fixer.replaceText(node, replacement);
                }
              }
            ]
          });
        }
      }
    };
  }
};
