import type {Rule, Scope} from 'eslint';
import type {
  CallExpression,
  Expression,
  Identifier,
  SpreadElement
} from 'estree';

function isNullOrUndefined(node: Expression): boolean {
  if (node.type === 'Literal' && node.value === null) {
    return true;
  }
  return node.type === 'Identifier' && node.name === 'undefined';
}

function isTimerCall(node: CallExpression): boolean {
  if (
    node.callee.type === 'Identifier' &&
    (node.callee.name === 'setTimeout' || node.callee.name === 'setInterval')
  ) {
    return true;
  }
  if (
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    (node.callee.object.name === 'window' ||
      node.callee.object.name === 'globalThis') &&
    node.callee.property.type === 'Identifier' &&
    (node.callee.property.name === 'setTimeout' ||
      node.callee.property.name === 'setInterval')
  ) {
    return true;
  }
  return false;
}

function isReassigned(scope: Scope.Scope, node: Identifier): boolean {
  for (let s: Scope.Scope | null = scope; s; s = s.upper) {
    const variable = s.set.get(node.name);
    if (variable) {
      return variable.references.some((ref) => !ref.init && ref.isWrite());
    }
  }
  return false;
}

function isSafeArgument(
  arg: Expression | SpreadElement,
  evaluatedEagerly: boolean,
  scope: Scope.Scope | null
): boolean {
  if (arg.type === 'SpreadElement') {
    return (
      evaluatedEagerly &&
      arg.argument.type === 'Identifier' &&
      isSafeArgument(arg.argument, evaluatedEagerly, scope)
    );
  }

  switch (arg.type) {
    case 'Identifier':
      return scope === null || !isReassigned(scope, arg);

    case 'Literal':
      return true;

    case 'TemplateLiteral':
      return arg.expressions.every((expr) =>
        isSafeArgument(expr, evaluatedEagerly, scope)
      );

    case 'MemberExpression':
      if (
        !evaluatedEagerly ||
        arg.object.type === 'Super' ||
        arg.property.type === 'PrivateIdentifier'
      ) {
        return false;
      }
      if (!isSafeArgument(arg.object, evaluatedEagerly, scope)) {
        return false;
      }
      if (arg.computed) {
        return isSafeArgument(arg.property, evaluatedEagerly, scope);
      }
      return true;

    case 'ArrayExpression':
      return arg.elements.every(
        (el) => el === null || isSafeArgument(el, evaluatedEagerly, scope)
      );

    case 'ObjectExpression':
      return arg.properties.every((prop) => {
        if (prop.type === 'SpreadElement') {
          return (
            evaluatedEagerly &&
            isSafeArgument(prop.argument, evaluatedEagerly, scope)
          );
        }
        const valueType = prop.value.type;
        if (
          valueType === 'ObjectPattern' ||
          valueType === 'ArrayPattern' ||
          valueType === 'RestElement' ||
          valueType === 'AssignmentPattern'
        ) {
          return false;
        }
        return isSafeArgument(prop.value, evaluatedEagerly, scope);
      });

    case 'UnaryExpression':
      if (arg.operator === 'delete') {
        return false;
      }
      return isSafeArgument(arg.argument, evaluatedEagerly, scope);

    case 'BinaryExpression':
    case 'LogicalExpression':
      return (
        arg.left.type !== 'PrivateIdentifier' &&
        isSafeArgument(arg.left, evaluatedEagerly, scope) &&
        isSafeArgument(arg.right, evaluatedEagerly, scope)
      );

    case 'ConditionalExpression':
      return (
        isSafeArgument(arg.test, evaluatedEagerly, scope) &&
        isSafeArgument(arg.consequent, evaluatedEagerly, scope) &&
        isSafeArgument(arg.alternate, evaluatedEagerly, scope)
      );

    // CallExpression, NewExpression, etc.
    default:
      return false;
  }
}

export const preferTimerArgs: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer passing function and arguments directly to setTimeout/setInterval instead of wrapping in an arrow function or using bind',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferArgs:
        'Pass function and arguments directly to timer function to avoid allocating an extra function'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: CallExpression) {
        if (!isTimerCall(node)) {
          return;
        }

        if (node.arguments.length < 2) {
          return;
        }

        const firstArg = node.arguments[0];
        if (!firstArg || firstArg.type === 'SpreadElement') {
          return;
        }

        const delayText = sourceCode.getText(node.arguments[1]!);
        const timerCall = sourceCode.getText(node.callee);

        let replacement: string | null = null;

        // simple arrow functions, e.g. () => fn(args)
        if (firstArg.type === 'ArrowFunctionExpression') {
          // skip if it is a block body
          if (firstArg.body.type === 'BlockStatement') {
            return;
          }

          // skip if it has parameters
          if (firstArg.params.length > 0) {
            return;
          }

          if (firstArg.body.type !== 'CallExpression') {
            return;
          }

          const callExpression = firstArg.body;
          const callee = callExpression.callee;
          const callArgs = callExpression.arguments;
          const scope = sourceCode.getScope(firstArg);

          if (callee.type !== 'Identifier' || isReassigned(scope, callee)) {
            return;
          }

          if (!callArgs.every((arg) => isSafeArgument(arg, false, scope))) {
            return;
          }

          const calleeText = sourceCode.getText(callee);

          if (callArgs.length === 0) {
            replacement = `${timerCall}(${calleeText}, ${delayText})`;
          } else {
            const argsTexts = callArgs.map((arg) => sourceCode.getText(arg));
            replacement = `${timerCall}(${calleeText}, ${delayText}, ${argsTexts.join(', ')})`;
          }
        }
        // fn.bind(null/undefined, args)
        else if (firstArg.type === 'CallExpression') {
          const bindCall = firstArg;

          if (
            bindCall.callee.type !== 'MemberExpression' ||
            bindCall.callee.property.type !== 'Identifier' ||
            bindCall.callee.property.name !== 'bind' ||
            bindCall.arguments.length === 0
          ) {
            return;
          }

          const bindContext = bindCall.arguments[0];
          if (!bindContext || bindContext.type === 'SpreadElement') {
            return;
          }

          if (!isNullOrUndefined(bindContext)) {
            return;
          }

          const fnText = sourceCode.getText(bindCall.callee.object);
          const bindArgs = bindCall.arguments.slice(1);

          // Check if any bind argument contains a call expression or other unsafe construct
          if (!bindArgs.every((arg) => isSafeArgument(arg, true, null))) {
            return;
          }

          if (bindArgs.length === 0) {
            replacement = `${timerCall}(${fnText}, ${delayText})`;
          } else {
            const argsTexts = bindArgs.map((arg) => sourceCode.getText(arg));
            replacement = `${timerCall}(${fnText}, ${delayText}, ${argsTexts.join(', ')})`;
          }
        } else {
          return;
        }

        if (replacement) {
          context.report({
            node,
            messageId: 'preferArgs',
            fix(fixer) {
              return fixer.replaceText(node, replacement);
            }
          });
        }
      }
    };
  }
};
