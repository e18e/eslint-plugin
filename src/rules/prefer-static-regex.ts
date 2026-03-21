import type {Rule} from 'eslint';
import type {Literal, NewExpression, RegExpLiteral} from 'estree';

const statefulFlags = /[gy]/;

function isStaticNewRegExp(node: NewExpression): boolean {
  if (
    node.callee.type !== 'Identifier' ||
    node.callee.name !== 'RegExp' ||
    node.arguments.length === 0 ||
    node.arguments.length > 2
  ) {
    return false;
  }

  if (
    !node.arguments.every(
      (arg) => arg.type === 'Literal' && typeof arg.value === 'string'
    )
  ) {
    return false;
  }

  const flagsArg = node.arguments[1] as Literal | undefined;
  if (flagsArg && statefulFlags.test(flagsArg.value as string)) {
    return false;
  }

  return true;
}

export const preferStaticRegex: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer defining regular expressions at module scope to avoid re-compilation on every function call',
      recommended: true
    },
    schema: [],
    messages: {
      preferStatic:
        'Move this regular expression to module scope to avoid re-compilation on every call.'
    }
  },
  create(context) {
    return {
      ':function Literal[regex]'(node: Rule.Node) {
        const {flags} = (node as unknown as RegExpLiteral).regex;
        if (statefulFlags.test(flags)) {
          return;
        }
        context.report({node, messageId: 'preferStatic'});
      },
      ':function NewExpression'(
        node: NewExpression & Rule.NodeParentExtension
      ) {
        if (isStaticNewRegExp(node)) {
          context.report({node, messageId: 'preferStatic'});
        }
      }
    };
  }
};
