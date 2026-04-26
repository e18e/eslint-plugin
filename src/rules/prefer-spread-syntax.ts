import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import {isArrayType} from '../utils/typescript.js';
import {isSyntacticallyKnownArray} from '../utils/ast.js';

type MessageIds =
  | 'preferSpreadArray'
  | 'preferSpreadArrayFrom'
  | 'preferSpreadObject'
  | 'preferSpreadFunction';

function isNullOrUndefined(node: TSESTree.Expression): boolean {
  if (node.type === 'Literal' && node.value === null) {
    return true;
  }
  return node.type === 'Identifier' && node.name === 'undefined';
}

export const preferSpreadSyntax: TSESLint.RuleModule<MessageIds, []> = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer spread syntax over Array.concat(), Array.from(), Object.assign({}, ...), and Function.apply()'
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferSpreadArray:
        'Use spread syntax [...arr, ...other] instead of arr.concat(other)',
      preferSpreadArrayFrom:
        'Use spread syntax [...iterable] instead of Array.from(iterable) when no mapper function is provided',
      preferSpreadObject:
        'Use spread syntax {...a, ...b} instead of Object.assign({}, a, b)',
      preferSpreadFunction:
        'Use spread syntax fn(...args) instead of fn.apply(null/undefined, args)'
    }
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== 'MemberExpression') {
          return;
        }

        let messageId: MessageIds | undefined;
        let replacement: string | undefined;

        // array.concat()
        // excluding Buffer.concat()
        if (
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'concat' &&
          node.arguments.length > 0 &&
          !(
            node.callee.object.type === 'Identifier' &&
            node.callee.object.name === 'Buffer'
          )
        ) {
          // If type info is available, only flag when the receiver is an array
          if (isArrayType(node.callee.object, context) === false) {
            return;
          }

          const parts: string[] = [];

          // For array literals, inline elements; otherwise spread
          const receiver = node.callee.object;
          if (receiver.type === 'ArrayExpression') {
            for (const el of receiver.elements) {
              if (el) {
                parts.push(sourceCode.getText(el));
              }
            }
          } else {
            parts.push(`...${sourceCode.getText(receiver)}`);
          }

          for (const arg of node.arguments) {
            if (arg.type === 'SpreadElement') {
              parts.push(sourceCode.getText(arg));
            } else if (arg.type === 'ArrayExpression') {
              for (const el of arg.elements) {
                if (el) {
                  parts.push(sourceCode.getText(el));
                }
              }
            } else {
              const typed = isArrayType(arg, context);
              if (
                typed === true ||
                (typed === undefined && isSyntacticallyKnownArray(arg))
              ) {
                parts.push(`...${sourceCode.getText(arg)}`);
              } else {
                parts.push(sourceCode.getText(arg));
              }
            }
          }

          replacement = `[${parts.join(', ')}]`;
          messageId = 'preferSpreadArray';
        }
        // Array.from(iterable) with no mapper
        else if (
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Array' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'from' &&
          node.arguments.length === 1
        ) {
          const firstArg = node.arguments[0]!;
          if (
            firstArg.type !== 'SpreadElement' &&
            firstArg.type !== 'ObjectExpression'
          ) {
            const iterableText = sourceCode.getText(firstArg);
            replacement = `[...${iterableText}]`;
            messageId = 'preferSpreadArrayFrom';
          }
        }
        // Object.assign({...}, ...)
        else if (
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Object' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'assign' &&
          node.arguments.length >= 2
        ) {
          const firstArg = node.arguments[0]!;
          if (
            firstArg.type !== 'SpreadElement' &&
            firstArg.type === 'ObjectExpression'
          ) {
            const hasUnquotedProto = firstArg.properties.some(
              (prop) =>
                prop.type === 'Property' &&
                !prop.computed &&
                prop.key.type === 'Identifier' &&
                prop.key.name === '__proto__'
            );

            if (!hasUnquotedProto) {
              const restArgs = node.arguments.slice(1);

              // If any argument is already a spread element (e.g. ...objs),
              // we can't safely convert since Object.assign({}, ...objs) spreads
              // array elements as individual arguments, which has no simple
              // equivalent in object spread syntax.
              if (restArgs.some((arg) => arg.type === 'SpreadElement')) {
                return;
              }

              const spreadArgs = restArgs
                .map((arg) => `...${sourceCode.getText(arg)}`)
                .join(', ');

              if (firstArg.properties.length === 0) {
                replacement = `{${spreadArgs}}`;
              } else {
                const literalText = sourceCode.getText(firstArg);
                const innerContent = literalText.slice(1, -1); // Remove { and }
                replacement = `{${innerContent}, ${spreadArgs}}`;
              }
              messageId = 'preferSpreadObject';
            }
          }
        }
        // function.apply(null/undefined, args)
        else if (
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'apply' &&
          node.arguments.length === 2
        ) {
          const firstArg = node.arguments[0]!;
          if (
            firstArg.type !== 'SpreadElement' &&
            isNullOrUndefined(firstArg)
          ) {
            const fnText = sourceCode.getText(node.callee.object);
            const argsText = sourceCode.getText(node.arguments[1]!);
            replacement = `${fnText}(...${argsText})`;
            messageId = 'preferSpreadFunction';
          }
        }

        if (messageId && replacement) {
          context.report({
            node,
            messageId,
            fix(fixer) {
              return fixer.replaceText(node, replacement!);
            }
          });
        }
      }
    };
  }
};
