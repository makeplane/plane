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

import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { CodeEditor } from "./code-editor";
// Import bundled types as raw string (Vite handles ?raw imports at build time)
const meta = {
  title: "Components/CodeEditor",
  component: CodeEditor,
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
    height: {
      control: "number",
    },
    fontSize: {
      control: "number",
    },
    tabSize: {
      control: "number",
    },
    readOnly: {
      control: "boolean",
    },
    minimap: {
      control: "boolean",
    },
    lineNumbers: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof CodeEditor>;

export default meta;
type Story = StoryObj<typeof CodeEditor>;

const sampleWithImports = `// Try typing: lodash. or zod.
// You should see autocomplete suggestions!

import { z } from "zod";
import _ from "lodash";

// Define a schema with Zod
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().positive().optional(),
});

type User = z.infer<typeof UserSchema>;

// Use lodash utilities
const users: User[] = [
  { id: "1", name: "Alice", email: "alice@example.com", age: 30 },
  { id: "2", name: "Bob", email: "bob@example.com" },
];

const sortedUsers = _.sortBy(users, "name");
const groupedByAge = _.groupBy(users, (u) => u.age ? "has-age" : "no-age");

console.log(sortedUsers);
`;

const samplePlaneSDKCode = `// Plane Node SDK Example
// Type 'client.' to see available APIs with full IntelliSense!

export async function main(event, ENV) {
    const issueId = event.webhook_event.data.id;
    const projectId = event.webhook_event.data.project;
    const issue = await Plane.workItems.retrieve(workspaceSlug, projectId, issueId);
    console.log(issue);
    return 100;
  }
  
`;

// Story with external libraries
function WithExternalLibrariesEditor() {
  const [value, setValue] = useState(sampleWithImports);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded">
        <strong>External Libraries Demo:</strong> This editor has <code>zod</code> and <code>lodash</code> types
        injected. Type <code>z.</code> or <code>_.</code> to see IntelliSense suggestions!
      </div>
      <CodeEditor
        value={value}
        onChange={(v: string | undefined) => setValue(v ?? "")}
        language="typescript"
        height={400}
        theme="plane-dark"
        externalLibraries={[
          { name: "zod", version: "3.23.8" },
          { name: "lodash", version: "4.17.21" },
        ]}
        builtInLibraries={["es2022", "dom"]}
      />
    </div>
  );
}

// Story with Plane Node SDK
function WithPlaneNodeSDKEditor() {
  const [value, setValue] = useState(samplePlaneSDKCode);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded">
        <strong>@makeplane/plane-node-sdk Demo:</strong> This editor has full IntelliSense for the Plane Node SDK. Try
        typing <code>client.</code> to see available APIs like <code>workItems</code>, <code>projects</code>,{" "}
        <code>cycles</code>, and <code>modules</code>!
      </div>

      <CodeEditor
        value={value}
        onChange={(v: string | undefined) => setValue(v ?? "")}
        language="typescript"
        height={400}
        theme="plane-dark"
        externalLibraries={[
          {
            name: "@makeplane/plane-node-sdk",
          },
        ]}
        customTypes={`
          declare global {
          const Plane: PlaneClient;
          const workspaceSlug: string;
          }
        `}
      />
    </div>
  );
}

export const WithPlaneNodeSDK: Story = {
  render: () => <WithPlaneNodeSDKEditor />,
  parameters: {
    docs: {
      description: {
        story:
          "This example demonstrates using @makeplane/plane-node-sdk with full IntelliSense support. The SDK types are injected via customTypes prop.",
      },
    },
  },
};

export const WithExternalLibraries: Story = {
  render: () => <WithExternalLibrariesEditor />,
  parameters: {
    docs: {
      description: {
        story:
          "This example demonstrates loading external npm package types (zod, lodash) for IntelliSense support. The types are fetched from CDN.",
      },
    },
  },
};
