/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import * as walk from "acorn-walk";
import { tsParser } from "./ts-parser";
import type { ASTNode } from "./ts-parser";

// Extend acorn-walk's base visitors to handle TypeScript AST nodes produced by
// @sveltejs/acorn-typescript. Without these, walk.simple() throws
// "No walker function defined for node type TSxxx".
const tsNodeTypes = [
  "TSInterfaceDeclaration",
  "TSTypeAliasDeclaration",
  "TSEnumDeclaration",
  "TSModuleDeclaration",
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSNonNullExpression",
  "TSTypeAssertion",
  "TSTypeAnnotation",
  "TSTypeParameterInstantiation",
  "TSTypeParameterDeclaration",
  "TSTypeReference",
  "TSQualifiedName",
  "TSFunctionType",
  "TSConstructorType",
  "TSMappedType",
  "TSConditionalType",
  "TSInferType",
  "TSIndexedAccessType",
  "TSLiteralType",
  "TSUnionType",
  "TSIntersectionType",
  "TSTupleType",
  "TSArrayType",
  "TSRestType",
  "TSOptionalType",
  "TSParenthesizedType",
  "TSTypePredicate",
  "TSTypeQuery",
  "TSImportType",
  "TSTypeLiteral",
  "TSPropertySignature",
  "TSMethodSignature",
  "TSIndexSignature",
  "TSCallSignatureDeclaration",
  "TSConstructSignatureDeclaration",
  "TSInterfaceBody",
  "TSEnumMember",
  "TSModuleBlock",
  "TSExternalModuleReference",
  "TSAbstractMethodDefinition",
  "TSParameterProperty",
  "TSDeclareFunction",
  "TSDeclareMethod",
  "TSAbstractPropertyDefinition",
  "TSInstantiationExpression",
] as const;

for (const nodeType of tsNodeTypes) {
  if (!(nodeType in walk.base)) {
    (walk.base as Record<string, walk.WalkerCallback<unknown>>)[nodeType] = () => {};
  }
}

export interface ValidationResult {
  valid: boolean;
  violations: string[];
}

// Identifiers that should never appear in user code
const BLOCKED_IDENTIFIERS = new Set([
  // Module system
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
  // Dangerous Node.js modules (in case they try to access them)
  "child_process",
  "cluster",
  "dgram",
  "dns",
  "fs",
  "http",
  "https",
  "net",
  "os",
  "path",
  "perf_hooks",
  "readline",
  "repl",
  "stream",
  "tls",
  "tty",
  "v8",
  "vm",
  "worker_threads",
  "zlib",
]);

// Global functions that can execute arbitrary code
const BLOCKED_GLOBALS = new Set(["eval", "Function"]);

// Dangerous process methods
const BLOCKED_PROCESS_METHODS = new Set([
  "abort",
  "binding",
  "chdir",
  "dlopen",
  "exit",
  "kill",
  "reallyExit",
  "setegid",
  "seteuid",
  "setgid",
  "setgroups",
  "setuid",
  "umask",
]);

// Prototype manipulation properties
const BLOCKED_PROPERTIES = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Validates user code for security vulnerabilities before execution.
 * Uses AST analysis to detect dangerous patterns.
 */
export function validateCodeSecurity(code: string): ValidationResult {
  const violations: string[] = [];

  try {
    const ast = tsParser.parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
    });

    walk.simple(ast, {
      // Block eval() and Function() calls
      CallExpression(node: ASTNode) {
        const callee = node.callee;

        if (callee?.type === "Identifier" && callee.name) {
          if (BLOCKED_GLOBALS.has(callee.name)) {
            violations.push(`'${callee.name}()' is not allowed - code execution risk`);
          }
        }

        // Block setTimeout/setInterval with string arguments (implicit eval)
        if (callee?.type === "Identifier" && ["setTimeout", "setInterval"].includes(callee.name || "")) {
          const args = node.arguments;
          if (args?.[0]?.type === "Literal" && typeof args[0].value === "string") {
            violations.push(`'${callee.name}' with string argument is not allowed - use a function instead`);
          }
        }
      },

      // Block new Function() and new Proxy()
      NewExpression(node: ASTNode) {
        const callee = node.callee;

        if (callee?.type === "Identifier" && callee.name) {
          if (BLOCKED_GLOBALS.has(callee.name)) {
            violations.push(`'new ${callee.name}()' is not allowed - code execution risk`);
          }
        }
      },

      // Block dangerous identifiers
      Identifier(node: ASTNode) {
        if (node.name && BLOCKED_IDENTIFIERS.has(node.name)) {
          violations.push(`'${node.name}' is not allowed - restricted API`);
        }
      },

      // Block dangerous property access
      MemberExpression(node: ASTNode) {
        const obj = node.object;
        const prop = node.property;

        // Get property name (handle both obj.prop and obj["prop"])
        const propName = prop?.type === "Identifier" ? prop.name : prop?.type === "Literal" ? String(prop.value) : null;

        if (propName) {
          // Block process.exit, process.kill, etc.
          if (obj?.type === "Identifier" && obj.name === "process" && BLOCKED_PROCESS_METHODS.has(propName)) {
            violations.push(`'process.${propName}' is not allowed - dangerous operation`);
          }

          // Block prototype manipulation
          if (BLOCKED_PROPERTIES.has(propName)) {
            violations.push(`Accessing '${propName}' is not allowed - prototype manipulation risk`);
          }
        }
      },

      // Detect obvious infinite loops
      WhileStatement(node: ASTNode) {
        const test = node.test;
        if (test?.type === "Literal" && test.value === true) {
          violations.push("'while(true)' is not allowed - infinite loop risk");
        }
      },

      ForStatement(node: ASTNode) {
        if (!node.test) {
          violations.push("'for(;;)' is not allowed - infinite loop risk");
        }
      },

      // Block with statements (can be used for scope manipulation)
      WithStatement() {
        violations.push("'with' statement is not allowed - scope manipulation risk");
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    violations.push(`Syntax error: ${error.message}`);
  }

  // Deduplicate violations (same pattern may appear multiple times)
  const uniqueViolations = [...new Set(violations)];

  return {
    valid: uniqueViolations.length === 0,
    violations: uniqueViolations,
  };
}
