/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { applyTransform } from "@hypermod/utils";
import { describe, expect, it } from "vitest";
import * as transformer from "../params-to-app-hook";

const OPTIONS = { parser: "tsx" as const, paramsImport: "@/hooks/use-params" };
const run = (source: string) => applyTransform(transformer, source, OPTIONS);

describe("params-to-app-hook", () => {
  it("repoints a sole useParams import to the app wrapper", async () => {
    const result = await run(`
      import { useParams } from "react-router";
      export const C = () => {
        const { workspaceSlug } = useParams();
        return <div>{workspaceSlug}</div>;
      };
    `);
    expect(result).toContain(`import { useParams } from "@/hooks/use-params"`);
    expect(result).not.toContain(`from "react-router"`);
    expect(result).toContain("const { workspaceSlug } = useParams();");
  });

  it("keeps other react-router specifiers in place", async () => {
    const result = await run(`
      import { useParams, useLocation, Link } from "react-router";
      export const C = () => {
        const { id } = useParams();
        const p = useLocation().pathname;
        return <Link to={p}>{id}</Link>;
      };
    `);
    expect(result).toContain(`import { useParams } from "@/hooks/use-params"`);
    // useLocation + Link must still come from react-router
    expect(result).toMatch(
      /import \{[^}]*useLocation[^}]*\} from "react-router"/
    );
    expect(result).toMatch(/import \{[^}]*Link[^}]*\} from "react-router"/);
    expect(result).not.toMatch(
      /import \{[^}]*useParams[^}]*\} from "react-router"/
    );
  });

  it("preserves an aliased useParams binding", async () => {
    const result = await run(`
      import { useParams as useRouterParams } from "react-router";
      export const C = () => {
        const { id } = useRouterParams();
        return <div>{id}</div>;
      };
    `);
    expect(result).toContain(
      `import { useParams as useRouterParams } from "@/hooks/use-params"`
    );
    expect(result).toContain("const { id } = useRouterParams();");
  });

  it("preserves the license header when the import led the file", async () => {
    const result = await run(`/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useParams } from "react-router";

export const C = () => <div>{useParams().id}</div>;
`);
    expect(result).toContain("SPDX-License-Identifier: AGPL-3.0-only");
    expect(result?.trimStart().startsWith("/**")).toBe(true);
    expect(result).toContain(`import { useParams } from "@/hooks/use-params"`);
  });

  it("leaves the wrapper module itself alone", async () => {
    // guarded by path, so simulate via a file without useParams from react-router
    const result = await run(`
      import { Outlet } from "react-router";
      export const C = () => <Outlet />;
    `);
    expect(result).toBe("");
  });
});
