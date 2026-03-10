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

import preview from "#.storybook/preview";
import { fn } from "storybook/test";
import { CodeEditor } from "./code-editor";

const meta = preview.meta({
  title: "Data Display/Code Editor",
  component: CodeEditor,
  args: {
    onChange: fn(),
  },
  argTypes: {
    language: {
      control: "select",
      options: ["json", "yaml", "javascript", "typescript", "python", "markdown", "html", "css", "sql", "plaintext"],
    },
    theme: {
      control: "select",
      options: ["vs-dark", "light", "plane-dark", "plane-light"],
    },
    wordWrap: {
      control: "select",
      options: ["on", "off", "wordWrapColumn", "bounded"],
    },
    height: { control: "number" },
    fontSize: { control: "number" },
    tabSize: { control: "number" },
    readOnly: { control: "boolean" },
    minimap: { control: "boolean" },
    lineNumbers: { control: "boolean" },
  },
});

const samplePlaneSDKCode = `// Plane Node SDK Example
export async function main(event, ENV) {
    const issueId = event.webhook_event.data.id;
    const projectId = event.webhook_event.data.project;
    const issue = await Plane.workItems.retrieve(workspaceSlug, projectId, issueId);
    console.log(issue);
    return 100;
  }
`;

const sampleWithImports = `import { z } from "zod";
import _ from "lodash";

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;
const users: User[] = [
  { id: "1", name: "Alice", email: "alice@example.com" },
];
const sortedUsers = _.sortBy(users, "name");
console.log(sortedUsers);
`;

const sampleJSON = `{
  "name": "plane",
  "version": "1.0.0",
  "description": "Project management tool",
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}`;

const sampleYAML = `name: plane
version: 1.0.0
services:
  web:
    port: 3000
    environment:
      - NODE_ENV=production
  api:
    port: 8000
    database: postgresql`;

const samplePython = `from typing import List, Optional

class ProjectManager:
    def __init__(self, name: str):
        self.name = name
        self.tasks: List[str] = []

    def add_task(self, task: str) -> None:
        self.tasks.append(task)

    def get_tasks(self) -> List[str]:
        return self.tasks

manager = ProjectManager("Plane")
manager.add_task("Build UI")
print(manager.get_tasks())`;

const sampleHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Plane</title>
</head>
<body>
  <div id="app">
    <h1>Welcome to Plane</h1>
    <p>Project management made simple.</p>
  </div>
</body>
</html>`;

const sampleCSS = `/* Plane Design System */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.button {
  background: var(--color-primary);
  color: white;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
}`;

const sampleSQL = `SELECT
  p.name AS project_name,
  COUNT(i.id) AS issue_count,
  AVG(i.priority) AS avg_priority
FROM projects p
LEFT JOIN issues i ON p.id = i.project_id
WHERE p.created_at > '2024-01-01'
GROUP BY p.name
ORDER BY issue_count DESC
LIMIT 10;`;

export const WithPlaneNodeSDK = meta.story({
  args: {
    value: samplePlaneSDKCode,
    language: "typescript",
    height: 400,
    theme: "plane-dark",
    externalLibraries: [{ name: "@makeplane/plane-node-sdk" }],
    customTypes: `
          declare global {
            const Plane: PlaneClient;
            const workspaceSlug: string;
          }
        `,
  },
});

export const WithPlaneNodeSDKTest = WithPlaneNodeSDK.extend({});

export const WithExternalLibraries = WithPlaneNodeSDK.extend({
  args: {
    value: sampleWithImports,
    externalLibraries: [
      { name: "zod", version: "3.23.8" },
      { name: "lodash", version: "4.17.21" },
    ],
    builtInLibraries: ["es2022", "dom"],
    customTypes: undefined,
  },
});

export const JSONLanguage = WithPlaneNodeSDK.extend({
  args: {
    value: sampleJSON,
    language: "json",
    height: 300,
    externalLibraries: undefined,
    customTypes: undefined,
  },
});

export const YAMLLanguage = JSONLanguage.extend({
  args: {
    value: sampleYAML,
    language: "yaml",
    theme: undefined,
  },
});

export const PythonLanguage = YAMLLanguage.extend({
  args: {
    value: samplePython,
    language: "python",
  },
});

export const HTMLLanguage = YAMLLanguage.extend({
  args: {
    value: sampleHTML,
    language: "html",
  },
});

export const CSSLanguage = YAMLLanguage.extend({
  args: {
    value: sampleCSS,
    language: "css",
  },
});

export const SQLLanguage = YAMLLanguage.extend({
  args: {
    value: sampleSQL,
    language: "sql",
  },
});

export const ReadOnly = meta.story({
  args: {
    value: sampleJSON,
    language: "json",
    height: 250,
    readOnly: true,
  },
});

export const ReadOnlyTest = ReadOnly.extend({});

export const LightTheme = JSONLanguage.extend({
  args: {
    theme: "light",
  },
});

export const NoLineNumbers = JSONLanguage.extend({
  args: {
    height: 250,
    lineNumbers: false,
  },
});

export const WithMinimap = PythonLanguage.extend({
  args: {
    height: 400,
    minimap: true,
  },
});

export const WordWrapOff = SQLLanguage.extend({
  args: {
    height: 250,
    wordWrap: "off",
  },
});

export const CustomFontAndTab = PythonLanguage.extend({
  args: {
    fontSize: 16,
    tabSize: 4,
  },
});

export const WithPlaceholder = YAMLLanguage.extend({
  args: {
    value: "",
    language: "javascript",
    height: 200,
    placeholder: "Start typing your code here...",
  },
});

export const NoLoading = JSONLanguage.extend({
  args: {
    height: 250,
    showLoading: false,
  },
});

export const StringHeight = meta.story({
  args: {
    value: sampleCSS,
    language: "css",
    height: "100%",
  },
  decorators: [
    (Story) => (
      <div style={{ height: 400 }}>
        <Story />
      </div>
    ),
  ],
});

export const JavaScriptLanguage = WithPlaneNodeSDK.extend({
  args: {
    language: "javascript",
    externalLibraries: undefined,
    customTypes: undefined,
  },
});

export const TypeScriptNoExtras = WithPlaneNodeSDK.extend({
  args: {
    externalLibraries: undefined,
    customTypes: undefined,
  },
});

export const CustomLoadingComponent = JSONLanguage.extend({
  args: {
    height: 250,
    showLoading: true,
    loadingComponent: <div data-testid="custom-loader">Custom loading...</div>,
  },
});

export const ReadOnlyNoOnChange = ReadOnly.extend({});
