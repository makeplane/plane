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

import type { EditorProps } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";

export type TCodeEditorLanguage =
  | "json"
  | "yaml"
  | "javascript"
  | "typescript"
  | "python"
  | "markdown"
  | "html"
  | "css"
  | "sql"
  | "xml"
  | "plaintext";

export type TCodeEditorTheme = "vs-dark" | "light" | "plane-dark" | "plane-light";

export type TCodeEditorRef = {
  /** Get the underlying Monaco editor instance */
  getEditor: () => monaco.editor.IStandaloneCodeEditor | null;
  /** Get the current editor value */
  getValue: () => string;
  /** Set the editor value programmatically */
  setValue: (value: string) => void;
  /** Format the document using the built-in formatter */
  formatDocument: () => Promise<void>;
  /** Focus the editor */
  focus: () => void;
};

/**
 * Configuration for an external library/package to inject into the editor.
 * This enables IntelliSense/autocomplete for the specified packages.
 */
export type TExternalLibrary = {
  /**
   * The npm package name (e.g., "lodash", "@types/node", "zod")
   * For packages with separate @types, use the types package name.
   */
  name: string;
  /**
   * Optional: The type definitions content (.d.ts file content).
   * If not provided, the editor will attempt to fetch from CDN.
   */
  content?: string;
  /**
   * Optional: The version of the package (e.g., "4.17.21").
   * Defaults to "latest".
   */
  version?: string;
};

/**
 * Built-in library presets that can be enabled
 */
export type TBuiltInLibrary = "es2022" | "dom" | "node" | "webworker";

export type TCodeEditorProps = {
  /** The current value of the editor */
  value: string;
  /** Callback fired when the editor value changes */
  onChange?: (value: string | undefined) => void;
  /** The programming language for syntax highlighting */
  language?: TCodeEditorLanguage;
  /** Height of the editor (number in px or string like "300px", "100%") */
  height?: string | number;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Show the minimap on the right side */
  minimap?: boolean;
  /** Show line numbers */
  lineNumbers?: boolean;
  /** Word wrap mode */
  wordWrap?: "on" | "off" | "wordWrapColumn" | "bounded";
  /** Additional CSS class name for the container */
  className?: string;
  /** Placeholder text shown when editor is empty */
  placeholder?: string;
  /** Theme for the editor */
  theme?: TCodeEditorTheme;
  /** Tab size for indentation */
  tabSize?: number;
  /** Font size in pixels */
  fontSize?: number;
  /** Whether to show the loading spinner while Monaco loads */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /**
   * External libraries/packages to inject for IntelliSense.
   * Can be package names (will fetch types from CDN) or full type definitions.
   */
  externalLibraries?: TExternalLibrary[];
  /**
   * Built-in TypeScript libraries to enable.
   * Defaults to ["es2022"].
   */
  builtInLibraries?: TBuiltInLibrary[];
  /**
   * Custom type definitions to inject directly.
   * Key is the virtual file path (e.g., "global.d.ts"), value is the content.
   */
  customTypes?: string;
} & Omit<EditorProps, "value" | "onChange" | "language" | "height" | "theme">;
