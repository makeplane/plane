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

export type TCodeLanguage = {
  id: string;
  label: string;
  aliases?: string[];
};

export const CODE_LANGUAGES: TCodeLanguage[] = [
  { id: "plaintext", label: "Plain Text", aliases: ["text", "txt"] },
  { id: "typescript", label: "TypeScript", aliases: ["ts"] },
  { id: "javascript", label: "JavaScript", aliases: ["js"] },
  { id: "jsx", label: "JSX" },
  { id: "tsx", label: "TSX" },
  { id: "json", label: "JSON" },
  { id: "yaml", label: "YAML", aliases: ["yml"] },
  { id: "markdown", label: "Markdown", aliases: ["md"] },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "scss", label: "SCSS", aliases: ["sass"] },
  { id: "python", label: "Python", aliases: ["py"] },
  { id: "java", label: "Java" },
  { id: "c", label: "C" },
  { id: "cpp", label: "C++", aliases: ["c++"] },
  { id: "csharp", label: "C#", aliases: ["cs", "c#"] },
  { id: "go", label: "Go", aliases: ["golang"] },
  { id: "rust", label: "Rust", aliases: ["rs"] },
  { id: "ruby", label: "Ruby", aliases: ["rb"] },
  { id: "php", label: "PHP" },
  { id: "swift", label: "Swift" },
  { id: "kotlin", label: "Kotlin", aliases: ["kt"] },
  { id: "scala", label: "Scala" },
  { id: "r", label: "R" },
  { id: "julia", label: "Julia", aliases: ["jl"] },
  { id: "lua", label: "Lua" },
  { id: "haskell", label: "Haskell", aliases: ["hs"] },
  { id: "sql", label: "SQL" },
  { id: "shellscript", label: "Shell", aliases: ["bash", "sh", "shell", "zsh"] },
  { id: "graphql", label: "GraphQL", aliases: ["gql"] },
  { id: "xml", label: "XML" },
  { id: "latex", label: "LaTeX", aliases: ["tex"] },
  { id: "mermaid", label: "Mermaid" },
];
