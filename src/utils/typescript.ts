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

/**
 * Gets the element types of an array or tuple node. Type parameters are
 * resolved to their constraint. Returns undefined if types are unavailable or
 * any part of the type is not an array/tuple
 */
function getArrayElementTypes(
  node: TSESTree.Node,
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>
):
  | {elements: ts.Type[]; checker: ts.TypeChecker; strictNullChecks: boolean}
  | undefined {
  const services = tryGetTypedParserServices(context);
  if (!services) {
    return undefined;
  }

  let type: ts.Type | undefined = services.getTypeAtLocation(node);
  if (!type) {
    return undefined;
  }

  const checker = services.program.getTypeChecker();
  if (type.isTypeParameter()) {
    type = checker.getBaseConstraintOfType(type);
    if (!type) {
      return undefined;
    }
  }

  const elements: ts.Type[] = [];
  for (const t of type.isUnion() ? type.types : [type]) {
    if (!checker.isArrayType(t) && !checker.isTupleType(t)) {
      return undefined;
    }
    elements.push(...checker.getTypeArguments(t as ts.TypeReference));
  }

  const options = services.program.getCompilerOptions();
  const strictNullChecks = options.strictNullChecks ?? options.strict ?? false;

  return {elements, checker, strictNullChecks};
}

/**
 * Checks if `type` may hold one of the `candidates` values. Type parameters
 * are checked through their constraint (no constraint means any value)
 */
function canTypeHoldAny(
  type: ts.Type,
  candidates: ts.Type[],
  checker: ts.TypeChecker
): boolean {
  if (type.isUnion()) {
    return type.types.some((t) => canTypeHoldAny(t, candidates, checker));
  }

  if (type.isTypeParameter()) {
    const constraint = checker.getBaseConstraintOfType(type);
    return (
      constraint === undefined ||
      canTypeHoldAny(constraint, candidates, checker)
    );
  }

  return candidates.some((c) => checker.isTypeAssignableTo(c, type));
}

/**
 * Checks if an array node may contain falsy elements (0, '', false, null,
 * undefined, 0n, NaN). Returns undefined if types are unavailable or the
 * node isn't known to be an array, letting callers choose their own default
 * behaviour.
 *
 * Branded primitives (`string & {__brand: 'x'}`) and string enums with an
 * empty member are treated as non-falsy, since the falsy literal is not
 * assignable to them.
 */
export function canArrayContainFalsy(
  node: TSESTree.Node,
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>
): boolean | undefined {
  const result = getArrayElementTypes(node, context);
  if (!result) {
    return undefined;
  }

  const {elements, checker, strictNullChecks} = result;
  const candidates = [
    checker.getFalseType(),
    checker.getNumberLiteralType(0),
    checker.getStringLiteralType(''),
    checker.getBigIntLiteralType({negative: false, base10Value: '0'})
  ];
  // Without strictNullChecks, null and undefined are assignable to every
  // type, so they can't tell us anything
  if (strictNullChecks) {
    candidates.push(checker.getNullType(), checker.getUndefinedType());
  }

  return elements.some((t) => canTypeHoldAny(t, candidates, checker));
}

/**
 * Checks if an array node may contain `undefined` elements. Returns undefined
 * if types are unavailable, the node isn't known to be an array, or
 * strictNullChecks is off
 */
export function canArrayContainUndefined(
  node: TSESTree.Node,
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>
): boolean | undefined {
  const result = getArrayElementTypes(node, context);
  if (!result || !result.strictNullChecks) {
    return undefined;
  }

  const {elements, checker} = result;
  const candidates = [checker.getUndefinedType()];
  return elements.some((t) => canTypeHoldAny(t, candidates, checker));
}
