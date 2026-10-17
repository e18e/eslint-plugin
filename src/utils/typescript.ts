import type {
  TSNode,
  TSToken,
  TSESTree,
  ParserServicesWithTypeInformation
} from '@typescript-eslint/typescript-estree';
import type {TSESLint} from '@typescript-eslint/utils';
import type ts from 'typescript';

export interface ParserServices {
  emitDecoratorMetadata: boolean | undefined;
  experimentalDecorators: boolean | undefined;
  isolatedDeclarations: boolean | undefined;
  esTreeNodeToTSNodeMap: WeakMap<TSESTree.Node, TSNode | TSToken>;
  tsNodeToESTreeNodeMap: WeakMap<TSNode | TSToken, TSESTree.Node>;
  getSymbolAtLocation: (node: TSESTree.Node) => ts.Symbol | undefined;
  getTypeAtLocation: (node: TSESTree.Node) => ts.Type;
  program: ts.Program;
}

export function tryGetTypedParserServices(
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>
): ParserServicesWithTypeInformation | null {
  if (context.sourceCode.parserServices?.program == null) {
    return null;
  }

  return context.sourceCode.parserServices as ParserServicesWithTypeInformation;
}

export function getTypedParserServices(
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>
): ParserServicesWithTypeInformation {
  const services = tryGetTypedParserServices(context);
  if (services === null) {
    throw new Error(
      `You have used a rule which requires type information. Please ensure you have typescript-eslint setup alongside this plugin and configured to enable type-aware linting. See https://typescript-eslint.io/getting-started/typed-linting for more information.`
    );
  }

  return services;
}

const typedArrayTypes = [
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
  'BigInt64Array',
  'BigUint64Array'
];

export type ArrayKind = 'unknown' | 'ambiguous' | 'array' | 'non-array';

export function getArrayKind(
  node: TSESTree.Node,
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>,
  strict = false
): ArrayKind {
  const services = tryGetTypedParserServices(context);
  if (!services) {
    return 'unknown';
  }

  const type = services.getTypeAtLocation(node);
  if (!type) {
    return 'unknown';
  }

  const checker = services.program.getTypeChecker();
  const types = type.isUnion() ? type.types : [type];
  let arrayCount = 0;

  for (const t of types) {
    if (checker.isArrayType(t) || checker.isTupleType(t)) {
      arrayCount++;
      continue;
    }

    if (strict) {
      continue;
    }

    const typeString = checker.typeToString(t);
    if (typedArrayTypes.some((name) => typeString.startsWith(name))) {
      arrayCount++;
    }
  }

  if (arrayCount === 0) {
    return 'non-array';
  }
  return arrayCount === types.length ? 'array' : 'ambiguous';
}

/**
 * Checks if a node's type is an Array type (Array, tuple, or typed array)
 * Returns undefined if types are unavailable, letting callers choose their
 * own default behaviour
 */
export function isArrayType(
  node: TSESTree.Node,
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>
): boolean | undefined {
  const kind = getArrayKind(node, context);
  return kind === 'unknown' ? undefined : kind === 'array';
}

function hasIteratorMember(type: ts.Type, checker: ts.TypeChecker): boolean {
  if (type.isUnion()) {
    return type.types.every((t) => hasIteratorMember(t, checker));
  }

  if (type.isIntersection()) {
    return type.types.some((t) => hasIteratorMember(t, checker));
  }

  // Iterators are named `__@iterator@<id>` internally
  return checker
    .getPropertiesOfType(checker.getApparentType(type))
    .some((prop) => prop.getName().startsWith('__@iterator'));
}

/**
 * Checks if a node's type is iterable (has a `[Symbol.iterator]` member)
 * Returns undefined if types are unavailable or the type is `any`/`unknown`,
 * letting callers choose their own default behaviour
 */
export function isIterableType(
  node: TSESTree.Node,
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>
): boolean | undefined {
  const services = tryGetTypedParserServices(context);
  if (!services) {
    return undefined;
  }

  const type = services.getTypeAtLocation(node);
  if (!type) {
    return undefined;
  }

  // ts.TypeFlags.Any | ts.TypeFlags.Unknown
  if (type.flags & (1 | 2)) {
    return undefined;
  }

  return hasIteratorMember(type, services.program.getTypeChecker());
}

const setTypePattern = /^(Readonly)?Set</;

/**
 * Checks if a node's type is a Set
 * Returns undefined if types are unavailable, letting callers choose their
 * own default behaviour
 */
export function isSetType(
  node: TSESTree.Node,
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>
): boolean | undefined {
  const services = tryGetTypedParserServices(context);
  if (!services) {
    return undefined;
  }

  const type = services.getTypeAtLocation(node);
  if (!type) {
    return undefined;
  }

  const checker = services.program.getTypeChecker();
  const typeString = checker.typeToString(type);

  return setTypePattern.test(typeString);
}

/**
 * Checks if a node's type is a string
 * Returns undefined if types are unavailable, letting callers choose their
 * own default behaviour
 */
export function isStringType(
  node: TSESTree.Node,
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>
): boolean | undefined {
  const services = tryGetTypedParserServices(context);
  if (!services) {
    return undefined;
  }

  const type = services.getTypeAtLocation(node);
  if (!type) {
    return undefined;
  }

  const checker = services.program.getTypeChecker();
  const stringType = checker.getStringType();

  return checker.isTypeAssignableTo(type, stringType);
}
