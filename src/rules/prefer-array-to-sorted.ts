import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import {
  getArrayFromCopyPattern,
  formatArguments,
  needsParensForPropertyAccess,
  isCopyPatternOptional
} from '../utils/ast.js';
import {isArrayType} from '../utils/typescript.js';

type MessageIds = 'preferToSorted';

const NON_ARRAY_COPY_SOURCE_CTORS = new Set(['Set', 'Map']);
const NON_ARRAY_COPY_SOURCE_TYPES = new Set([
  'Iterable',
  'IterableIterator',
  'Iterator',
  'Map',
  'ReadonlyMap',
  'ReadonlySet',
  'Set',
  'URLSearchParams'
]);
const ITERATOR_RETURNING_METHODS = new Set(['entries', 'keys', 'values']);

type NodeWithTypeAnnotation = TSESTree.Node & {
  typeAnnotation?: TSESTree.TSTypeAnnotation;
};

function getTypeReferenceName(node: TSESTree.Node): string | null {
  if (node.type !== 'TSTypeReference') {
    return null;
  }

  const {typeName} = node;
  if (typeName.type === 'Identifier') {
    return typeName.name;
  }
  if (typeName.type === 'TSQualifiedName') {
    return typeName.right.name;
  }
  return null;
}

function hasKnownNonArrayTypeAnnotation(node: TSESTree.Node): boolean {
  const typeAnnotation = (node as NodeWithTypeAnnotation).typeAnnotation;
  if (typeAnnotation?.type !== 'TSTypeAnnotation') {
    return false;
  }

  const annotation = typeAnnotation.typeAnnotation;
  if (annotation.type === 'TSUnionType') {
    return annotation.types.some((typeNode) =>
      hasKnownNonArrayType(typeNode as TSESTree.Node)
    );
  }
  return hasKnownNonArrayType(annotation as TSESTree.Node);
}

function hasKnownNonArrayType(node: TSESTree.Node): boolean {
  const typeName = getTypeReferenceName(node);
  return typeName !== null && NON_ARRAY_COPY_SOURCE_TYPES.has(typeName);
}

function isIteratorReturningCall(node: TSESTree.Node): boolean {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    ITERATOR_RETURNING_METHODS.has(node.callee.property.name) &&
    !(
      node.callee.object.type === 'Identifier' &&
      node.callee.object.name === 'Object'
    )
  );
}

function isKnownNonArrayCopySource(node: TSESTree.Node): boolean {
  return (
    isIteratorReturningCall(node) ||
    (node.type === 'NewExpression' &&
      node.callee.type === 'Identifier' &&
      NON_ARRAY_COPY_SOURCE_CTORS.has(node.callee.name))
  );
}

function resolvesToKnownNonArrayCopySource(
  node: TSESTree.Node,
  context: TSESLint.RuleContext<MessageIds, []>
): boolean {
  if (isKnownNonArrayCopySource(node)) {
    return true;
  }

  if (node.type !== 'Identifier') {
    return false;
  }

  const variable = context.sourceCode
    .getScope(node)
    .references.find((ref) => ref.identifier === node)?.resolved;

  if (!variable || variable.defs.length !== 1) {
    return false;
  }

  const def = variable.defs[0];
  if (!def || (def.type !== 'Variable' && def.type !== 'Parameter')) {
    return false;
  }

  if (hasKnownNonArrayTypeAnnotation(def.name as TSESTree.Node)) {
    return true;
  }

  if (def.type !== 'Variable' || def.node.type !== 'VariableDeclarator') {
    return false;
  }

  const init = def.node.init;
  if (hasKnownNonArrayTypeAnnotation(def.node.id)) {
    return true;
  }

  return (
    init !== null &&
    isKnownNonArrayCopySource(init) &&
    variable.references.every((ref) => !ref.isWrite() || ref.writeExpr === init)
  );
}

export const preferArrayToSorted: TSESLint.RuleModule<MessageIds, []> = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Array.prototype.toSorted() over copying and sorting arrays'
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferToSorted: 'Use {{array}}.toSorted() instead of copying and sorting'
    }
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier' ||
          node.callee.property.name !== 'sort'
        ) {
          return;
        }

        const sortCallee = node.callee.object;
        const arrayNode = getArrayFromCopyPattern(sortCallee);

        if (arrayNode) {
          const arrayType = isArrayType(arrayNode, context);
          if (arrayType === false) {
            return;
          }

          if (
            arrayType !== true &&
            resolvesToKnownNonArrayCopySource(arrayNode, context)
          ) {
            return;
          }

          const rawText = sourceCode.getText(arrayNode);
          const arrayText = needsParensForPropertyAccess(arrayNode)
            ? `(${rawText})`
            : rawText;
          const argsText = formatArguments(node.arguments, sourceCode);
          const optionalChain = isCopyPatternOptional(sortCallee) ? '?.' : '.';

          context.report({
            node,
            messageId: 'preferToSorted',
            data: {
              array: rawText
            },
            fix(fixer) {
              return fixer.replaceText(
                node,
                `${arrayText}${optionalChain}toSorted(${argsText})`
              );
            }
          });
        }
      }
    };
  }
};
