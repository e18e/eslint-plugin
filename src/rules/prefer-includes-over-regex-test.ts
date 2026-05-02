import type {Rule} from 'eslint';
import type {CallExpression, Expression, RegExpLiteral} from 'estree';

function isRegexLiteral(node: Expression): node is RegExpLiteral {
  return node.type === 'Literal' && 'regex' in node && node.regex !== undefined;
}

const SPECIAL_CHARS_RE = /[\\.*+?()[\]{}|^$]/;

type Kind = 'includes' | 'startsWith' | 'endsWith' | 'equals';

function classifyRegex(pattern: string): {kind: Kind; literal: string} | null {
  let body = pattern;
  let hasStart = false;
  let hasEnd = false;

  if (body.startsWith('^')) {
    hasStart = true;
    body = body.slice(1);
  }
  // A trailing `$` is the end anchor unless it's preceded by an unescaped `\`
  if (body.endsWith('$') && !body.endsWith('\\$')) {
    hasEnd = true;
    body = body.slice(0, -1);
  }

  if (body.length === 0) return null;
  if (SPECIAL_CHARS_RE.test(body)) return null;

  let kind: Kind;
  if (hasStart && hasEnd) kind = 'equals';
  else if (hasStart) kind = 'startsWith';
  else if (hasEnd) kind = 'endsWith';
  else kind = 'includes';

  return {kind, literal: body};
}

function needsParens(node: Expression): boolean {
  switch (node.type) {
    case 'Identifier':
    case 'Literal':
    case 'MemberExpression':
    case 'CallExpression':
    case 'NewExpression':
    case 'ThisExpression':
    case 'ArrayExpression':
    case 'ObjectExpression':
    case 'TemplateLiteral':
    case 'TaggedTemplateExpression':
      return false;
    default:
      return true;
  }
}

export const preferIncludesOverRegexTest: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer String.prototype.{includes,startsWith,endsWith} over equivalent regex.test() calls',
      recommended: false
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferIncludes:
        "Prefer `s.includes('{{literal}}')` over `/{{pattern}}/.test(s)`.",
      preferStartsWith:
        "Prefer `s.startsWith('{{literal}}')` over `/^{{literal}}/.test(s)`.",
      preferEndsWith:
        "Prefer `s.endsWith('{{literal}}')` over `/{{literal}}$/.test(s)`.",
      preferEquals:
        "Prefer `s === '{{literal}}'` over `/^{{literal}}$/.test(s)`."
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;
    return {
      CallExpression(node: CallExpression) {
        if (node.callee.type !== 'MemberExpression') return;
        if (node.callee.computed) return;
        if (
          node.callee.property.type !== 'Identifier' ||
          node.callee.property.name !== 'test'
        )
          return;
        if (node.arguments.length !== 1) return;

        const regex = node.callee.object;
        if (regex.type !== 'Literal' || !isRegexLiteral(regex)) return;
        if (regex.regex.flags !== '') return;

        const cls = classifyRegex(regex.regex.pattern);
        if (!cls) return;

        const arg = node.arguments[0]!;
        if (arg.type === 'SpreadElement') return;
        const argText = needsParens(arg as Expression)
          ? `(${sourceCode.getText(arg)})`
          : sourceCode.getText(arg);
        const literalText = JSON.stringify(cls.literal);

        let replacement: string;
        let messageId: string;
        switch (cls.kind) {
          case 'includes':
            replacement = `${argText}.includes(${literalText})`;
            messageId = 'preferIncludes';
            break;
          case 'startsWith':
            replacement = `${argText}.startsWith(${literalText})`;
            messageId = 'preferStartsWith';
            break;
          case 'endsWith':
            replacement = `${argText}.endsWith(${literalText})`;
            messageId = 'preferEndsWith';
            break;
          case 'equals':
            replacement = `${argText} === ${literalText}`;
            messageId = 'preferEquals';
            break;
        }

        context.report({
          node,
          messageId,
          data: {literal: cls.literal, pattern: regex.regex.pattern},
          fix(fixer) {
            return fixer.replaceText(node, replacement);
          }
        });
      }
    };
  }
};
