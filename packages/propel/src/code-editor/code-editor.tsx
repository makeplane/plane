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

import { Editor, loader } from "@monaco-editor/react";
import type { OnMount, BeforeMount, Monaco } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import * as React from "react";
// helpers
import { cn } from "../utils";
// local imports
import { addCustomTypes, COMMON_TYPE_DEFINITIONS, configureTypeScript, loadExternalLibraries } from "./lib-loader";
import type { TCodeEditorProps, TCodeEditorRef } from "./types";

// Define custom Plane themes
const defineCustomThemes = (monacoInstance: Monaco) => {
  // Plane Dark theme - matches the app's dark mode
  monacoInstance.editor.defineTheme("plane-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [{ fontStyle: "normal" }],
    colors: {
      "editor.background": "#1d1f20",
    },
  });
};

// Initialize custom themes when Monaco loads
void loader.init().then((monacoInstance) => {
  defineCustomThemes(monacoInstance);
});

const CodeEditor = React.forwardRef<TCodeEditorRef, TCodeEditorProps>(function CodeEditor(props, ref) {
  const {
    value,
    onChange,
    language = "json",
    height = 300,
    readOnly = false,
    minimap = false,
    lineNumbers = true,
    wordWrap = "on",
    className,
    placeholder,
    theme = "plane-dark",
    tabSize = 2,
    fontSize = 13,
    showLoading = true,
    loadingComponent,
    externalLibraries,
    builtInLibraries = ["es2022"],
    customTypes,
    ...rest
  } = props;

  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = React.useRef<Monaco | null>(null);

  // Expose imperative methods via ref
  React.useImperativeHandle(ref, () => ({
    getEditor: () => editorRef.current,
    getValue: () => editorRef.current?.getValue() ?? "",
    setValue: (val: string) => editorRef.current?.setValue(val),
    formatDocument: async () => {
      await editorRef.current?.getAction("editor.action.formatDocument")?.run();
    },
    focus: () => editorRef.current?.focus(),
  }));

  // Configure Monaco before it mounts (for TypeScript settings and libs)
  const handleBeforeMount: BeforeMount = async (monacoInstance) => {
    monacoRef.current = monacoInstance;

    // Define custom themes
    defineCustomThemes(monacoInstance);

    // Configure TypeScript compiler options
    if (language === "typescript" || language === "javascript") {
      configureTypeScript(monacoInstance, builtInLibraries);
      let contents: string[] = [];
      // Load external libraries (types are always provided via content property)
      if (externalLibraries && externalLibraries.length > 0) {
        contents = loadExternalLibraries(monacoInstance, externalLibraries);
      }

      // THEN add custom type definitions (which may import from external libraries)
      if (customTypes) {
        addCustomTypes(monacoInstance, {
          "globals.d.ts": COMMON_TYPE_DEFINITIONS.console + COMMON_TYPE_DEFINITIONS.fetch,
          "custom-types.d.ts": contents.join("\n") + customTypes,
        });
      }
    }
  };

  const handleMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    // Ensure custom themes are defined
    defineCustomThemes(monacoInstance);

    // Apply the theme after mounting
    monacoInstance.editor.setTheme(theme);
  };

  const handleChange = (newValue: string | undefined) => {
    onChange?.(newValue);
  };

  // Default loading component
  const defaultLoading = (
    <div className="flex items-center justify-center h-full bg-layer-2 text-tertiary text-13">
      <span>Loading editor...</span>
    </div>
  );

  return (
    <div
      className={cn(
        "rounded-md border border-subtle overflow-hidden bg-layer-2",
        {
          "opacity-60": readOnly,
        },
        className
      )}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleChange}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        theme={theme}
        loading={showLoading ? (loadingComponent ?? defaultLoading) : null}
        options={{
          readOnly,
          minimap: { enabled: minimap },
          lineNumbers: lineNumbers ? "on" : "off",
          wordWrap,
          fontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, 'Courier New', monospace",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize,
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          renderLineHighlight: "line",
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          folding: true,
          foldingHighlight: true,
          showFoldingControls: "mouseover",
          matchBrackets: "always",
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          formatOnPaste: true,
          formatOnType: true,
          // Enable suggestions
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          // Placeholder-like behavior using aria-label
          ariaLabel: placeholder,
        }}
        {...rest}
      />
    </div>
  );
});

CodeEditor.displayName = "CodeEditor";

export { CodeEditor };
