import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';
import {needsParensForPropertyAccess} from '../utils/ast.js';
import {tryGetTypedParserServices} from '../utils/typescript.js';

type MessageIds = 'preferCharCodeAt' | 'replaceWithCharCodeAt';

const EQUALITY_OPERATORS = new Set(['===', '!==', '==', '!=']);
const LOOP_TYPES = new Set([
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement'
]);
const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression'
]);

function isSingleCharStringLiteral(
  node: TSESTree.Node
): node is TSESTree.StringLiteral {
  return (
    node.type === 'Literal' &&
    typeof node.value === 'string' &&
    node.value.length === 1
  );
}

function isComputedMember(
  node: TSESTree.Node
): node is TSESTree.MemberExpression {
  return node.type === 'MemberExpression' && node.computed && !node.optional;
}

function isStringLiteralExpression(node: TSESTree.Node): boolean {
  return (
    (node.type === 'Literal' && typeof node.value === 'string') ||
    (node.type === 'TemplateLiteral' && node.expressions.length === 0)
  );
}

function getTypeInfo(
  node: TSESTree.Node,
  context: Readonly<TSESLint.RuleContext<MessageIds, []>>
): {type: ts.Type; checker: ts.TypeChecker} | null {
  const services = tryGetTypedParserServices(context);
  if (!services) {
    return null;
  }
  const type = services.getTypeAtLocation(node);
  if (!type) {
    return null;
  }
  return {type, checker: services.program.getTypeChecker()};
}

function isKnownStringExpression(
  node: TSESTree.Node,
  context: Readonly<TSESLint.RuleContext<MessageIds, []>>
): boolean {
  if (isStringLiteralExpression(node)) {
    return true;
  }
  const info = getTypeInfo(node, context);
  if (!info) {
    return false;
  }
  if (info.checker.typeToString(info.type) === 'any') {
    return false;
  }
  return info.checker.isTypeAssignableTo(
    info.type,
    info.checker.getStringType()
  );
}

function isUnsafeIndex(
  property: TSESTree.Node,
  context: Readonly<TSESLint.RuleContext<MessageIds, []>>
): boolean {
  if (property.type === 'Literal') {
    return typeof property.value === 'number'
      ? !Number.isInteger(property.value)
      : true;
  }
  const info = getTypeInfo(property, context);
  if (!info) {
    return false;
  }
  return !info.checker.isTypeAssignableTo(
    info.type,
    info.checker.getNumberType()
  );
}

function isInLoop(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (FUNCTION_TYPES.has(current.type)) {
      return false;
    }
    if (LOOP_TYPES.has(current.type)) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

export const preferCharCodeAtInLoop: TSESLint.RuleModule<MessageIds, []> = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer `charCodeAt()` over indexed string access for single-character comparisons inside loops'
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      preferCharCodeAt:
        'Comparing indexed string access to a single-character string can allocate and compare a one-character string. In a loop, charCodeAt() against a numeric code unit is faster.',
      replaceWithCharCodeAt:
        'Replace with charCodeAt() and code unit {{code}} for {{quoted}}.'
    }
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      BinaryExpression(node: TSESTree.BinaryExpression) {
        if (!EQUALITY_OPERATORS.has(node.operator)) {
          return;
        }

        let member: TSESTree.MemberExpression;
        let charLiteral: TSESTree.StringLiteral;
        let charOnRight: boolean;

        if (
          isComputedMember(node.left) &&
          isSingleCharStringLiteral(node.right)
        ) {
          member = node.left;
          charLiteral = node.right;
          charOnRight = true;
        } else if (
          isSingleCharStringLiteral(node.left) &&
          isComputedMember(node.right)
        ) {
          member = node.right;
          charLiteral = node.left;
          charOnRight = false;
        } else {
          return;
        }

        if (!isInLoop(node)) {
          return;
        }

        if (isUnsafeIndex(member.property, context)) {
          return;
        }

        if (!isKnownStringExpression(member.object, context)) {
          return;
        }

        const rawObjectText = sourceCode.getText(member.object);
        const objectText =
          needsParensForPropertyAccess(member.object) ||
          member.object.type === 'ChainExpression'
            ? `(${rawObjectText})`
            : rawObjectText;
        const indexText = sourceCode.getText(member.property);
        const char = charLiteral.value;
        const code = char.charCodeAt(0);
        const charCodeAtCall = `${objectText}.charCodeAt(${indexText})`;
        const replacement = charOnRight
          ? `${charCodeAtCall} ${node.operator} ${code}`
          : `${code} ${node.operator} ${charCodeAtCall}`;

        context.report({
          node,
          messageId: 'preferCharCodeAt',
          suggest: [
            {
              messageId: 'replaceWithCharCodeAt',
              data: {
                code: String(code),
                quoted: JSON.stringify(char)
              },
              fix(fixer) {
                return fixer.replaceText(node, replacement);
              }
            }
          ]
        });
      }
    };
  }
};
