# jscodeshift Instructions

## API Reference

### Core API

#### `jscodeshift`

The main function that returns the jscodeshift instance.

- **Parameters**: `source` (String)
- **Example**:
  ```javascript
  const j = jscodeshift(sourceCode);
  ```

### Node Traversal APIs

#### `find`

Finds nodes that match the provided type.

- **Parameters**: `type` (String or Function)
- **Example**:
  ```javascript
  const variableDeclarations = j.find(j.VariableDeclaration);
  ```

#### `findImportDeclarations`

Finds all ImportDeclarations optionally filtered by name.

- **Parameters**: `sourcePath` (String)
- **Example**:
  ```javascript
  const routerImports = j.findImportDeclarations("react-router-dom");
  ```

#### `closestScope`

Finds the closest enclosing scope of a node.

- **Example**:
  ```javascript
  const closestScopes = j.find(j.Identifier).closestScope();
  ```

#### `closest`

Finds the nearest parent node that matches the specified type.

- **Parameters**: `type` (String or Function)
- **Example**:
  ```javascript
  const closestFunction = j.find(j.Identifier).closest(j.FunctionDeclaration);
  ```

#### `getVariableDeclarators`

Retrieves variable declarators from the current collection.

- **Parameters**: `callback` (Function)
- **Example**:
  ```javascript
  const variableDeclarators = j
    .find(j.Identifier)
    .getVariableDeclarators((path) => path.value.name);
  ```

#### `findVariableDeclarators`

Finds variable declarators by name.

- **Parameters**: `name` (String)
- **Example**:
  ```javascript
  const variableDeclarators = j.findVariableDeclarators("a");
  ```

#### `filter`

Filters nodes based on a predicate function.

- **Parameters**: `predicate` (Function)
- **Example**:
  ```javascript
  const constDeclarations = j
    .find(j.VariableDeclaration)
    .filter((path) => path.node.kind === "const");
  ```

#### `forEach`

Iterates over each node in the collection.

- **Parameters**: `callback` (Function)
- **Example**:
  ```javascript
  j.find(j.VariableDeclaration).forEach((path) => {
    console.log(path.node);
  });
  ```

#### `some`

Checks if at least one element in the collection passes the test.

- **Parameters**: `callback` (Function)
- **Example**:
  ```javascript
  const hasVariableA = root
    .find(j.VariableDeclarator)
    .some((path) => path.node.id.name === "a");
  ```

#### `every`

Checks if all elements in the collection pass the test.

- **Parameters**: `callback` (Function)
- **Example**:
  ```javascript
  const allAreConst = root
    .find(j.VariableDeclaration)
    .every((path) => path.node.kind === "const");
  ```

#### `map`

Maps each node in the collection to a new value.

- **Parameters**: `callback` (Function)
- **Example**:
  ```javascript
  const variableNames = j
    .find(j.VariableDeclaration)
    .map((path) => path.node.declarations.map((decl) => decl.id.name));
  ```

#### `size`

Returns the number of nodes in the collection.

- **Example**:
  ```javascript
  const numberOfNodes = j.find(j.VariableDeclaration).size();
  ```

#### `length`

Returns the number of elements in the collection.

- **Example**:
  ```javascript
  const varCount = root.find(j.VariableDeclarator).length;
  ```

#### `nodes`

Returns the AST nodes in the collection.

- **Example**:
  ```javascript
  const nodes = j.find(j.VariableDeclaration).nodes();
  ```

#### `paths`

Returns the paths of the found nodes.

- **Example**:
  ```javascript
  const paths = j.find(j.VariableDeclaration).paths();
  ```

#### `getAST`

Returns the root AST node of the collection.

- **Example**:
  ```javascript
  const ast = root.getAST();
  ```

#### `get`

Gets the first node in the collection.

- **Example**:
  ```javascript
  const firstVariableDeclaration = j.find(j.VariableDeclaration).get();
  ```

#### `at`

Navigates to a specific path in the AST.

- **Parameters**: `index` (Number)
- **Example**:
  ```javascript
  const secondVariableDeclaration = j.find(j.VariableDeclaration).at(1);
  ```

#### `getTypes`

Returns the set of node types present in the collection.

- **Example**:
  ```javascript
  const types = root.find(j.VariableDeclarator).getTypes();
  ```

#### `isOfType`

Checks if the node in the collection is of a specific type.

- **Parameters**: `type` (String)
- **Example**:
  ```javascript
  const isVariableDeclarator = root
    .find(j.VariableDeclarator)
    .at(0)
    .isOfType("VariableDeclarator");
  ```

### Node Transformation APIs

#### `replaceWith`

Replaces the current node(s) with a new node.

- **Parameters**: `newNode` (Node or Function)
- **Example**:
  ```javascript
  j.find(j.Identifier).replaceWith((path) =>
    j.identifier(path.node.name.toUpperCase())
  );
  ```

#### `insertBefore`

Inserts a node before the current node.

- **Parameters**: `newNode` (Node)
- **Example**:
  ```javascript
  j.find(j.FunctionDeclaration).insertBefore(
    j.expressionStatement(j.stringLiteral("Inserted before"))
  );
  ```

#### `insertAfter`

Inserts a node after the current node.

- **Parameters**: `newNode` (Node)
- **Example**:
  ```javascript
  j.find(j.FunctionDeclaration).insertAfter(
    j.expressionStatement(j.stringLiteral("Inserted after"))
  );
  ```

#### `remove`

Removes the current node(s).

- **Example**:
  ```javascript
  j.find(j.VariableDeclaration).remove();
  ```

#### `renameTo`

Renames the nodes in the collection to a new name.

- **Parameters**: `newName` (String)
- **Example**:
  ```javascript
  root.find(j.Identifier, { name: "a" }).renameTo("x");
  ```

#### `toSource`

Converts the transformed AST back to source code.

- **Parameters**: `options` (Object)
- **Example**:
  ```javascript
  const transformedSource = j.toSource({ quote: "single" });
  ```

## AST Grammar

jscodeshift provides 278 node types which are mapped to their corresponding node type in `ast-types`.

### Common Node Types

- **AnyTypeAnnotation**: A type annotation representing any type.
- **ArrayExpression**: Represents an array literal.
- **ArrayPattern**: A pattern that matches an array from a destructuring assignment.
- **ArrayTypeAnnotation**: A type annotation for arrays.
- **ArrowFunctionExpression**: An arrow function expression.
- **AssignmentExpression**: Represents an assignment expression.
- **AssignmentPattern**: A pattern that matches an assignment from a destructuring assignment.
- **AwaitExpression**: Represents an await expression.
- **BigIntLiteral**: A literal representing a big integer.
- **BinaryExpression**: Represents a binary expression.
- **BlockStatement**: Represents a block statement.
- **BooleanLiteral**: A literal representing a boolean value.
- **BreakStatement**: Represents a break statement.
- **CallExpression**: Represents a call expression.
- **CatchClause**: Represents a catch clause in a try statement.
- **ClassDeclaration**: Represents a class declaration.
- **ClassExpression**: Represents a class expression.
- **ClassMethod**: Represents a method of a class.
- **ClassProperty**: Represents a property of a class.
- **Comment**: Represents a comment in the code.
- **ConditionalExpression**: Represents a conditional expression (ternary).
- **ContinueStatement**: Represents a continue statement.
- **DebuggerStatement**: Represents a debugger statement.
- **Declaration**: Represents a declaration in the code.
- **DoWhileStatement**: Represents a do…while statement.
- **ExportAllDeclaration**: Represents an export all declaration.
- **ExportDeclaration**: Represents an export declaration.
- **ExportDefaultDeclaration**: Represents an export default declaration.
- **ExportNamedDeclaration**: Represents a named export declaration.
- **ExpressionStatement**: Represents an expression statement.
- **File**: Represents a file in the AST.
- **ForInStatement**: Represents a for-in statement.
- **ForOfStatement**: Represents a for-of statement.
- **ForStatement**: Represents a for statement.
- **FunctionDeclaration**: Represents a function declaration.
- **FunctionExpression**: Represents a function expression.
- **Identifier**: Represents an identifier.
- **IfStatement**: Represents an if statement.
- **ImportDeclaration**: Represents an import declaration.
- **ImportDefaultSpecifier**: Represents a default import specifier.
- **ImportNamespaceSpecifier**: Represents a namespace import specifier.
- **ImportSpecifier**: Represents an import specifier.
- **InterfaceDeclaration**: Represents an interface declaration.
- **JSXAttribute**: Represents an attribute in a JSX element.
- **JSXElement**: Represents a JSX element.
- **JSXExpressionContainer**: Represents an expression container in JSX.
- **JSXFragment**: Represents a JSX fragment.
- **JSXIdentifier**: Represents an identifier in JSX.
- **JSXText**: Represents text in JSX.
- **Literal**: Represents a literal value.
- **LogicalExpression**: Represents a logical expression.
- **MemberExpression**: Represents a member expression.
- **MethodDefinition**: Represents a method definition.
- **NewExpression**: Represents a new expression.
- **ObjectExpression**: Represents an object expression.
- **ObjectPattern**: Represents an object pattern for destructuring.
- **ObjectProperty**: Represents a property in an object.
- **Program**: Represents the entire program.
- **Property**: Represents a property in an object.
- **ReturnStatement**: Represents a return statement.
- **SpreadElement**: Represents a spread element in an array or function call.
- **StringLiteral**: Represents a string literal.
- **SwitchCase**: Represents a case in a switch statement.
- **SwitchStatement**: Represents a switch statement.
- **TemplateLiteral**: Represents a template literal.
- **ThisExpression**: Represents the `this` expression.
- **ThrowStatement**: Represents a throw statement.
- **TryStatement**: Represents a try statement.
- **TSAnyKeyword**: Represents the TypeScript `any` keyword.
- **TSArrayType**: Represents a TypeScript array type.
- **TSAsExpression**: Represents a TypeScript as-expression.
- **TSBooleanKeyword**: Represents the TypeScript `boolean` keyword.
- **TSDeclareFunction**: Represents a TypeScript function declaration.
- **TSEnumDeclaration**: Represents a TypeScript enum declaration.
- **TSInterfaceDeclaration**: Represents a TypeScript interface declaration.
- **TSNumberKeyword**: Represents the TypeScript `number` keyword.
- **TSStringKeyword**: Represents the TypeScript `string` keyword.
- **TSTypeAliasDeclaration**: Represents a TypeScript type alias declaration.
- **TSTypeAnnotation**: Represents a TypeScript type annotation.
- **TSTypeReference**: Represents a type reference in TypeScript.
- **TSUnionType**: Represents a union type in TypeScript.
- **UnaryExpression**: Represents a unary expression.
- **VariableDeclaration**: Represents a variable declaration.
- **VariableDeclarator**: Represents a variable declarator.
- **WhileStatement**: Represents a while statement.

For a complete list and detailed structure of each node, refer to the [AST Grammar documentation](https://jscodeshift.com/build/ast-grammar/).
