import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import {tryGetTypedParserServices} from '../utils/typescript.js';

type MessageIds = 'preferTest';

function isRegExpLiteral(node: TSESTree.Node): node is TSESTree.Literal {
  return (
    node.type === 'Literal' &&
    'regex' in node &&
    node.regex !== undefined &&
    node.regex !== null
  );
}

/**
 * Checks if a node is a `new RegExp(...)`
 */
function isRegExpConstructor(node: TSESTree.Node): boolean {
  if (node.type !== 'NewExpression') {
    return false;
  }

  const {callee} = node;

  // new RegExp()
  if (callee.type === 'Identifier' && callee.name === 'RegExp') {
    return true;
  }

  // new window.RegExp() or new globalThis.RegExp()
  if (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'Identifier' &&
    (callee.object.name === 'window' || callee.object.name === 'globalThis') &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'RegExp' &&
    !callee.computed
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a node is a RegExp (literal or constructor)
 */
function isRegExp(node: TSESTree.Node | null | undefined): boolean {
  return (
    node !== null &&
    node !== undefined &&
    (isRegExpLiteral(node) || isRegExpConstructor(node))
  );
}

/**
 * Checks if a node resolves to a RegExp using TypeScript types (when available)
 */
function isRegExpByType(
  node: TSESTree.Node,
  context: TSESLint.RuleContext<MessageIds, []>
): boolean {
  const services = tryGetTypedParserServices(context);
  if (!services) {
    return false;
  }

  const type = services.getTypeAtLocation(node);
  if (!type) {
    return false;
  }

  const checker = services.program.getTypeChecker();
  const typeString = checker.typeToString(type);

  return typeString === 'RegExp';
}

/**
 * Checks if a node resolves to a RegExp (literal, constructor, or by type)
 */
function resolvesToRegExp(
  node: TSESTree.Node,
  context: TSESLint.RuleContext<MessageIds, []>
): boolean {
  if (isRegExpByType(node, context)) {
    return true;
  }

  if (isRegExp(node)) {
    return true;
  }

  if (node.type !== 'Identifier') {
    return false;
  }

  const scope = context.sourceCode.getScope(node);
  const variable = scope.references.find(
    (ref) => ref.identifier === node
  )?.resolved;

  if (!variable) {
    return false;
  }

  for (const def of variable.defs) {
    if (def.type === 'Variable' && def.node.type === 'VariableDeclarator') {
      const init = def.node.init;
      if (isRegExp(init)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if a node is in a test/condition
 */
function isInBooleanContext(node: TSESTree.Node): boolean {
  const parent = node.parent;

  if (!parent) {
    return false;
  }

  // if/while/for/do-while test
  if (
    (parent.type === 'IfStatement' && parent.test === node) ||
    (parent.type === 'WhileStatement' && parent.test === node) ||
    (parent.type === 'ForStatement' && parent.test === node) ||
    (parent.type === 'DoWhileStatement' && parent.test === node)
  ) {
    return true;
  }

  // ternaries
  if (parent.type === 'ConditionalExpression' && parent.test === node) {
    return true;
  }

  // check the parent
  if (
    (parent.type === 'UnaryExpression' && parent.operator === '!') ||
    (parent.type === 'LogicalExpression' &&
      (parent.operator === '&&' || parent.operator === '||'))
  ) {
    return isInBooleanContext(parent);
  }

  return false;
}

export const preferRegexTest: TSESLint.RuleModule<MessageIds, []> = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'prefer `RegExp.test()` over `String.match()` and `RegExp.exec()` when only checking for match existence'
    },
    fixable: 'code',
    messages: {
      preferTest:
        'Prefer `{{regex}}.test({{string}})` over `{{original}}` for boolean checks'
    },
    schema: []
  },
  defaultOptions: [],

  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (!isInBooleanContext(node)) {
          return;
        }

        const {callee} = node;

        if (callee.type !== 'MemberExpression') {
          return;
        }

        const property = callee.property;

        if (property.type !== 'Identifier' || node.arguments.length !== 1) {
          return;
        }

        let regexNode: TSESTree.Node;
        let stringNode: TSESTree.Node;

        if (property.name === 'match') {
          // str.match(regex)
          stringNode = callee.object;
          regexNode = node.arguments[0]!;
        } else if (property.name === 'exec') {
          // regex.exec(str)
          regexNode = callee.object;
          stringNode = node.arguments[0]!;
        } else {
          return;
        }

        if (!resolvesToRegExp(regexNode, context)) {
          return;
        }

        const sourceCode = context.sourceCode;
        const regexText = sourceCode.getText(regexNode);
        const stringText = sourceCode.getText(stringNode);

        context.report({
          node,
          messageId: 'preferTest',
          data: {
            regex: regexText,
            string: stringText,
            original: sourceCode.getText(node)
          },
          fix(fixer) {
            return fixer.replaceText(node, `${regexText}.test(${stringText})`);
          }
        });
      }
    };
  }
};
