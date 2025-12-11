import { CommentKind } from "ast-types/gen/kinds";
import {
  API,
  FileInfo,
  Options,
  JSCodeshift,
  TSTypeReference,
  Identifier,
  BlockStatement,
  Expression,
  Pattern,
  SpreadElement,
  JSXNamespacedName,
  ASTNode,
  Node,
  FunctionDeclaration,
  TSType,
  VariableDeclarator,
  ArrowFunctionExpression,
  FunctionExpression,
} from "jscodeshift";

const COMPONENT_TYPE_NAMES = new Set([
  "FC",
  "FunctionComponent",
  "VFC",
  "VoidFunctionComponent",
]);

const COMPONENT_NAME_PATTERN = /^[A-Z]/;

function isReactComponentType(typeReference: TSTypeReference, j: JSCodeshift) {
  const typeName = typeReference.typeName;

  if (!typeName) {
    return false;
  }

  if (j.Identifier.check(typeName)) {
    return COMPONENT_TYPE_NAMES.has(typeName.name);
  }

  if (
    j.TSQualifiedName.check(typeName) &&
    j.Identifier.check(typeName.left) &&
    j.Identifier.check(typeName.right)
  ) {
    return (
      typeName.left.name === "React" &&
      COMPONENT_TYPE_NAMES.has(typeName.right.name)
    );
  }

  return false;
}

function isComponentNameIdentifier(identifier: Identifier | null | undefined) {
  if (!identifier) {
    return false;
  }

  // Must start with uppercase
  if (!COMPONENT_NAME_PATTERN.test(identifier.name)) {
    return false;
  }

  // Ignore CONSTANT_CASE (all uppercase)
  if (
    identifier.name.toUpperCase() === identifier.name &&
    identifier.name.length > 1
  ) {
    return false;
  }

  return true;
}

function addComments(target: Node, comments: CommentKind[]) {
  if (!comments || comments.length === 0) {
    return;
  }
  target.comments ||= [];
  target.comments.push(...comments);
}

function copyOuterComments(source: Node, target: Node, j: JSCodeshift) {
  if (!j.Node.check(source) || !j.Node.check(target) || !source.comments) {
    return;
  }
  const outerComments = source.comments.filter((c) => c.leading || c.trailing);
  addComments(target, outerComments);
}

function ensureParamType(
  param: Pattern,
  propsType: TSType | null | undefined,
  j: JSCodeshift
) {
  if (!j.Pattern.check(param)) {
    return;
  }

  if (!("typeAnnotation" in param)) {
    return;
  }

  if (!propsType) {
    return;
  }

  if (j.TSTypeReference.check(propsType) && propsType.typeName) {
    param.typeAnnotation = j.tsTypeAnnotation(
      propsType.typeParameters
        ? j.tsTypeReference(propsType.typeName, propsType.typeParameters)
        : j.tsTypeReference(propsType.typeName)
    );
    return;
  }

  if (j.TSType.check(propsType)) {
    // @ts-expect-error: jscodeshift types are too strict here
    param.typeAnnotation = j.tsTypeAnnotation(propsType);
  }
}

function toBlockBody(j: JSCodeshift, body: BlockStatement | Expression) {
  if (j.BlockStatement.check(body)) {
    return body;
  }

  // @ts-expect-error: jscodeshift types are too strict here
  const returnStatement = j.returnStatement(body);

  return j.blockStatement([returnStatement]);
}

function isFunction(
  node: Node,
  j: JSCodeshift
): node is ArrowFunctionExpression | FunctionExpression {
  return (
    j.ArrowFunctionExpression.check(node) || j.FunctionExpression.check(node)
  );
}

function extractArrowFunction(
  init: Expression | SpreadElement | JSXNamespacedName,
  j: JSCodeshift
): ArrowFunctionExpression | FunctionExpression | undefined {
  if (isFunction(init, j)) {
    return init;
  }

  // If it's a CallExpression like observer(() => {}), extract the arrow function
  if (j.CallExpression.check(init)) {
    const firstArg = init.arguments?.[0];
    if (firstArg && isFunction(firstArg, j)) {
      return firstArg;
    }
  }

  return;
}

function extractPropsTypeFromWrapper(
  init: Expression | SpreadElement | JSXNamespacedName,
  j: JSCodeshift
) {
  // If it's a CallExpression like observer<React.FC<Props>>((props) => {})
  // Extract the Props type from React.FC<Props>
  if (!j.CallExpression.check(init)) {
    return;
  }

  if (!("typeParameters" in init)) {
    return;
  }

  const typeParameters = init.typeParameters;
  if (!j.TSTypeParameterInstantiation.check(typeParameters)) {
    return;
  }

  const typeParam = typeParameters.params?.[0];

  if (!typeParam) {
    return;
  }

  if (
    j.TSTypeReference.check(typeParam) &&
    isReactComponentType(typeParam, j)
  ) {
    // Extract the generic type from React.FC<PropsType>
    return typeParam.typeParameters?.params?.[0];
  }

  // Check for memo<Props>
  const callee = init.callee;
  let isMemo = false;
  if (j.Identifier.check(callee) && callee.name === "memo") {
    isMemo = true;
  } else if (
    j.MemberExpression.check(callee) &&
    j.Identifier.check(callee.property) &&
    callee.property.name === "memo"
  ) {
    isMemo = true;
  }

  if (isMemo) {
    // For memo<Props>, the first type parameter is the props type
    // @ts-expect-error: jscodeshift types are too strict here
    return typeParam;
  }

  return;
}

function isReactForwardRef(
  init: Expression | SpreadElement | JSXNamespacedName,
  j: JSCodeshift
) {
  if (!j.CallExpression.check(init)) {
    return false;
  }

  const callee = init.callee;

  // Check for React.forwardRef
  if (
    j.MemberExpression.check(callee) &&
    j.Identifier.check(callee.object) &&
    j.Identifier.check(callee.property)
  ) {
    return (
      callee.object.name === "React" && callee.property.name === "forwardRef"
    );
  }

  // Check for forwardRef (imported directly)
  if (j.Identifier.check(callee)) {
    return callee.name === "forwardRef";
  }

  return false;
}

function extractForwardRefTypes(
  init: Expression | SpreadElement | JSXNamespacedName,
  j: JSCodeshift
) {
  if (!isReactForwardRef(init, j)) {
    return;
  }

  if (!j.CallExpression.check(init) || !("typeParameters" in init)) {
    return;
  }

  const typeParameters = init.typeParameters;

  // If no type parameters, we still want to apply default empty object for props
  if (
    !j.TSTypeParameterInstantiation.check(typeParameters) ||
    typeParameters.params.length === 0
  ) {
    return; // Let the default props type handling take care of it
  }

  const typeParams = typeParameters.params;

  // React.forwardRef<ElementType, PropsType>
  // If PropsType is not specified, use Record<string, unknown> to avoid ESLint errors
  const [elementType] = typeParams;

  if (!elementType) {
    return;
  }

  const propsType =
    typeParams.length >= 2 && typeParams[1]
      ? typeParams[1]
      : j.tsTypeReference(
          j.identifier("Record"),
          j.tsTypeParameterInstantiation([
            j.tsStringKeyword(),
            j.tsUnknownKeyword(),
          ])
        );

  // Create React.ForwardedRef<ElementType> for the ref parameter
  const refType = j.tsTypeReference(
    j.tsQualifiedName(j.identifier("React"), j.identifier("ForwardedRef")),
    j.tsTypeParameterInstantiation([elementType])
  );

  return { propsType, refType };
}

function isEmptyObjectType(type: TSType, j: JSCodeshift) {
  return j.TSTypeLiteral.check(type) && type.members.length === 0;
}

function convertToFunction(
  j: JSCodeshift,
  declaration: VariableDeclarator,
  init: Expression | SpreadElement | JSXNamespacedName,
  propsType: TSType | null | undefined
) {
  if (!j.Identifier.check(declaration.id)) {
    throw new Error("Declaration id must be an identifier");
  }
  const componentName = declaration.id.name;
  const arrowFn = extractArrowFunction(init, j);

  if (!arrowFn) {
    throw new Error("Expected ArrowFunctionExpression or FunctionExpression");
  }

  const params = arrowFn.params;
  const body = toBlockBody(j, arrowFn.body);

  const newFunction = j.functionDeclaration(
    j.identifier(componentName),
    params,
    body
  );

  // Check if this is React.forwardRef and extract types for props and ref
  const forwardRefTypes = extractForwardRefTypes(init, j);

  if (forwardRefTypes) {
    // Apply props type to first parameter
    const [firstParam, secondParam] = newFunction.params;
    if (j.Pattern.check(firstParam) && "typeAnnotation" in firstParam) {
      ensureParamType(firstParam, forwardRefTypes.propsType, j);
    }
    // Apply ref type to second parameter
    if (j.Pattern.check(secondParam) && "typeAnnotation" in secondParam) {
      ensureParamType(secondParam, forwardRefTypes.refType, j);
    }
  } else if (newFunction.params.length > 0) {
    const [firstParam] = newFunction.params;
    if (firstParam) {
      ensureParamType(firstParam, propsType, j);
    }
  } else if (propsType && !isEmptyObjectType(propsType, j)) {
    // If there are no params but a non-empty propsType exists, add _props parameter
    const propsParam = j.identifier("_props");
    ensureParamType(propsParam, propsType, j);
    newFunction.params.push(propsParam);
  }

  if (arrowFn.returnType) {
    newFunction.returnType = arrowFn.returnType;
  }

  // Preserve type parameters (generics) from arrow function
  if (arrowFn.typeParameters) {
    newFunction.typeParameters = arrowFn.typeParameters;
  }

  newFunction.async = arrowFn.async;
  newFunction.generator = arrowFn.generator;

  return newFunction;
}

function containsJsx(j: JSCodeshift, body: ASTNode) {
  return (
    j(body).find(j.JSXElement).paths().length > 0 ||
    j(body).find(j.JSXFragment).paths().length > 0
  );
}

function toFunctionExpression(
  j: JSCodeshift,
  declaration: FunctionDeclaration
) {
  const expression = j.functionExpression(
    declaration.id,
    declaration.params,
    declaration.body,
    declaration.generator,
    declaration.async
  );
  expression.returnType = declaration.returnType;
  expression.typeParameters = declaration.typeParameters;
  return expression;
}

export default function transform(file: FileInfo, api: API, options: Options) {
  const baseJ = api.jscodeshift;
  const j =
    typeof baseJ.withParser === "function" ? baseJ.withParser("tsx") : baseJ;
  const root = j(file.source);

  root
    .find(j.VariableDeclaration)
    .filter((path) => {
      const [firstDeclaration] = path.node.declarations;

      if (!j.VariableDeclarator.check(firstDeclaration)) {
        return false;
      }

      if (
        !j.Identifier.check(firstDeclaration.id) ||
        !isComponentNameIdentifier(firstDeclaration.id)
      ) {
        return false;
      }

      const init = firstDeclaration.init;

      if (!init) {
        return false;
      }

      const functionToCheck = extractArrowFunction(init, j);

      if (!functionToCheck) {
        return false;
      }

      if (file.path && !file.path.endsWith(".tsx")) {
        if (!containsJsx(j, functionToCheck)) {
          return false;
        }
      }

      return true;
    })
    .forEach((path) => {
      const [firstDeclaration] = path.node.declarations;
      if (!j.VariableDeclarator.check(firstDeclaration)) {
        return;
      }
      const init = firstDeclaration.init;

      if (!init) {
        return;
      }

      let typeAnnotation: ASTNode | null | undefined;
      if (j.Identifier.check(firstDeclaration.id)) {
        typeAnnotation = firstDeclaration.id.typeAnnotation?.typeAnnotation;
      }

      // Try to get props type from variable type annotation first
      let propsType: TSType | undefined = undefined;

      if (
        j.TSTypeReference.check(typeAnnotation) &&
        isReactComponentType(typeAnnotation, j)
      ) {
        propsType = typeAnnotation.typeParameters?.params?.[0];
      }

      // If no props type from variable annotation, try to extract from wrapper's type parameters
      if (!propsType) {
        propsType = extractPropsTypeFromWrapper(init, j);
      }

      const newFunction = convertToFunction(
        j,
        firstDeclaration,
        init,
        propsType
      );

      const originalNode = path.node;

      // Check if init is wrapped in a call expression (e.g., observer(...))
      const hasWrapper = j.CallExpression.check(init);

      if (hasWrapper) {
        // Preserve the wrapper by keeping it as a const assignment
        // e.g., export const Foo = observer(() => {}) becomes export const Foo = observer(function Foo() {...})

        // Convert function declaration to function expression for wrapping
        const functionExpression = toFunctionExpression(j, newFunction);

        const wrappedFunction = j.callExpression(init.callee, [
          functionExpression,
          ...init.arguments.slice(1),
        ]);

        if (!j.Identifier.check(firstDeclaration.id)) {
          return;
        }

        const newDeclarator = j.variableDeclarator(
          j.identifier(firstDeclaration.id.name),
          wrappedFunction
        );

        const newVarDecl = j.variableDeclaration("const", [newDeclarator]);

        // Copy comments from original declaration to new function
        copyOuterComments(originalNode, newVarDecl, j);

        j(path).replaceWith(newVarDecl);
        return;
      }

      // Copy outer comments from original declaration to new function
      copyOuterComments(originalNode, newFunction, j);

      // Copy comments from VariableDeclarator (e.g. export /* comment */ const Foo)
      if (firstDeclaration.comments) {
        addComments(newFunction, firstDeclaration.comments);
      }

      // Copy comments from arrow function
      if (init.comments) {
        addComments(newFunction, init.comments);
      }

      j(path).replaceWith(newFunction);
    });

  const quote = options.quote ?? '"';

  const source = root.toSource({
    quote,
  });

  return source;
}
