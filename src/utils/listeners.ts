import type {Rule} from 'eslint';
import type {TSESTree} from '@typescript-eslint/typescript-estree';
import type {MemberNode} from '@humanwhocodes/momoa';
import type {AST as JsonESTree} from 'jsonc-eslint-parser';

export type ImportListenerCallback = (
  context: Rule.RuleContext,
  node: Rule.Node,
  source: string
) => void;

const dependencyKeys = ['dependencies', 'devDependencies'];

/**
 * Creates a rule listener which listens for import/require calls and
 * calls a callback when one is found
 */
export function createImportListener(
  context: Rule.RuleContext,
  callback: ImportListenerCallback
): Rule.RuleListener {
  return {
    ImportDeclaration: (node) => {
      if (
        node.source.type !== 'Literal' ||
        typeof node.source.value !== 'string'
      ) {
        return;
      }

      callback(context, node, node.source.value);
    },
    ImportExpression: (node) => {
      if (
        node.source.type !== 'Literal' ||
        typeof node.source.value !== 'string'
      ) {
        return;
      }

      callback(context, node, node.source.value);
    },
    TSImportEqualsDeclaration: (astNode: Rule.Node) => {
      const node = astNode as unknown as TSESTree.TSImportEqualsDeclaration;
      const moduleRef = node.moduleReference;
      if (
        moduleRef.type !== 'TSExternalModuleReference' ||
        moduleRef.expression.type !== 'Literal' ||
        typeof moduleRef.expression.value !== 'string'
      ) {
        return;
      }

      callback(context, astNode, moduleRef.expression.value);
    },
    CallExpression: (node) => {
      const [arg0] = node.arguments;
      if (
        arg0 === undefined ||
        node.callee.type !== 'Identifier' ||
        node.callee.name !== 'require' ||
        arg0.type !== 'Literal' ||
        typeof arg0.value !== 'string'
      ) {
        return;
      }

      callback(context, node, arg0.value);
    }
  };
}

/**
 * Creates a rule listener for detecting dependencies in a `package.json`
 * file
 */
export function createPackageJsonListener(
  context: Rule.RuleContext,
  callback: ImportListenerCallback
): Rule.RuleListener {
  return {
    // Support for `@eslint/json`
    'Document > Object > Member': (node: unknown) => {
      const memberNode = node as MemberNode;
      if (
        memberNode.name.type === 'String' &&
        dependencyKeys.includes(memberNode.name.value) &&
        memberNode.value.type === 'Object'
      ) {
        for (const member of memberNode.value.members) {
          if (member.name.type === 'String') {
            callback(
              context,
              member as unknown as Rule.Node,
              member.name.value
            );
          }
        }
      }
    },
    // Support for `jsonc-eslint-parser`
    'Program > JSONExpressionStatement > JSONObjectExpression > JSONProperty': (
      astNode: Rule.Node
    ) => {
      const node = astNode as unknown as JsonESTree.JSONProperty;

      if (
        node.key.type === 'JSONLiteral' &&
        typeof node.key.value === 'string' &&
        dependencyKeys.includes(node.key.value) &&
        node.value.type === 'JSONObjectExpression'
      ) {
        for (const prop of node.value.properties) {
          if (
            prop.key.type === 'JSONLiteral' &&
            typeof prop.key.value === 'string'
          ) {
            callback(context, prop as unknown as Rule.Node, prop.key.value);
          }
        }
      }
    }
  };
}
