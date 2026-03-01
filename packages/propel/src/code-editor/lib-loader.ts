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

import type { Monaco } from "@monaco-editor/react";
import type { TBuiltInLibrary, TExternalLibrary } from "./types";

// Track which libraries have been added to avoid duplicates
const addedLibraries = new Set<string>();

/**
 * Configure TypeScript compiler options for the editor
 */
export function configureTypeScript(monaco: Monaco, builtInLibs: TBuiltInLibrary[] = ["es2022"]) {
  const libMap: Record<TBuiltInLibrary, string[]> = {
    es2022: ["es2022"],
    dom: ["dom", "dom.iterable"],
    node: ["es2022"],
    webworker: ["webworker"],
  };

  const libs = builtInLibs.flatMap((lib) => libMap[lib] || []);

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    allowJs: true,
    checkJs: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    skipLibCheck: true,
    lib: libs,
    jsx: monaco.languages.typescript.JsxEmit.React,
  });

  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    allowJs: true,
    checkJs: true,
    noEmit: true,
    esModuleInterop: true,
    skipLibCheck: true,
    lib: libs,
    jsx: monaco.languages.typescript.JsxEmit.React,
  });

  // Enable diagnostics
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });

  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });
}

/**
 * Add a type definition to Monaco
 */
export function addExtraLib(monaco: Monaco, content: string, filePath: string) {
  if (addedLibraries.has(filePath)) {
    return;
  }

  monaco.languages.typescript.typescriptDefaults.addExtraLib(content, filePath);
  monaco.languages.typescript.javascriptDefaults.addExtraLib(content, filePath);
  addedLibraries.add(filePath);
}

/**
 * Load external libraries and add their types to Monaco
 */
export function loadExternalLibraries(monaco: Monaco, libraries: TExternalLibrary[]): string[] {
  const contents: string[] = [];

  libraries.forEach((lib) => {
    const filePath = `file:///node_modules/${lib.name}/index.d.ts`;

    if (addedLibraries.has(filePath)) {
      return;
    }
    const content = lib.content;

    if (content) {
      addExtraLib(monaco, content, filePath);

      // Also create a module declaration if the package doesn't have one
      if (!content.includes(`declare module "${lib.name}"`)) {
        const moduleDeclaration = `declare module "${lib.name}" { export * from "${filePath}"; }`;
        addExtraLib(monaco, moduleDeclaration, `file:///node_modules/${lib.name}/module.d.ts`);
      }

      contents.push(content);
    }
  });

  return contents;
}

/**
 * Add custom type definitions
 */
export function addCustomTypes(monaco: Monaco, customTypes: Record<string, string>) {
  Object.entries(customTypes).forEach(([filePath, content]) => {
    const fullPath = filePath.startsWith("file://") ? filePath : `file:///${filePath}`;
    addExtraLib(monaco, content, fullPath);
  });
}

/**
 * Common type definitions that are useful in many contexts
 */
export const COMMON_TYPE_DEFINITIONS = {
  // Console API
  console: `
declare const console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
  debug(...args: any[]): void;
  table(data: any): void;
  clear(): void;
  time(label?: string): void;
  timeEnd(label?: string): void;
  group(label?: string): void;
  groupEnd(): void;
};
`,

  // JSON API
  json: `
declare const JSON: {
  parse(text: string, reviver?: (key: string, value: any) => any): any;
  stringify(value: any, replacer?: (key: string, value: any) => any | (string | number)[], space?: string | number): string;
};
`,

  // Fetch API
  fetch: `
declare function fetch(input: string | Request, init?: RequestInit): Promise<Response>;

interface RequestInit {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
  mode?: RequestMode;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  redirect?: RequestRedirect;
  referrer?: string;
  integrity?: string;
}

interface Response {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  json(): Promise<any>;
  text(): Promise<string>;
  blob(): Promise<Blob>;
  arrayBuffer(): Promise<ArrayBuffer>;
  clone(): Response;
}
`,

  // Promise
  promise: `
interface PromiseConstructor {
  new <T>(executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void): Promise<T>;
  all<T>(values: readonly (T | PromiseLike<T>)[]): Promise<T[]>;
  race<T>(values: readonly (T | PromiseLike<T>)[]): Promise<T>;
  resolve<T>(value: T): Promise<T>;
  reject<T = never>(reason?: any): Promise<T>;
}
declare const Promise: PromiseConstructor;
`,
};
