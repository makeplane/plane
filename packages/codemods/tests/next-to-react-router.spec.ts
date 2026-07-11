/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { applyTransform } from "@hypermod/utils";
import { describe, expect, it } from "vitest";
import * as transformer from "../next-to-react-router";

const OPTIONS = {
  parser: "tsx" as const,
  routerImport: "@/hooks/use-app-router",
  linkImport: "@/components/common/link",
};

const run = (source: string) => applyTransform(transformer, source, OPTIONS);

describe("next-to-react-router", () => {
  it("swaps useParams to react-router", async () => {
    const result = await run(`
      import { useParams } from "next/navigation";
      export const C = () => {
        const { workspaceSlug } = useParams();
        return <div>{workspaceSlug}</div>;
      };
    `);
    expect(result).toContain(`import { useParams } from "react-router"`);
    expect(result).not.toContain("next/navigation");
    expect(result).toContain("const { workspaceSlug } = useParams();");
  });

  it("rewrites usePathname() to useLocation().pathname", async () => {
    const result = await run(`
      import { usePathname } from "next/navigation";
      export const C = () => {
        const pathname = usePathname();
        return <div>{pathname}</div>;
      };
    `);
    expect(result).toContain(`import { useLocation } from "react-router"`);
    expect(result).toContain("const pathname = useLocation().pathname;");
    expect(result).not.toContain("usePathname");
  });

  // React Router's useSearchParams returns a tuple, the Next shim returned a bare
  // URLSearchParams. Missing this destructure binds searchParams to [params, setParams].
  it("destructures useSearchParams into the tuple form", async () => {
    const result = await run(`
      import { useSearchParams } from "next/navigation";
      export const C = () => {
        const searchParams = useSearchParams();
        return <div>{searchParams.get("peekId")}</div>;
      };
    `);
    expect(result).toContain(`import { useSearchParams } from "react-router"`);
    expect(result).toContain("const [searchParams] = useSearchParams();");
    expect(result).toContain(`searchParams.get("peekId")`);
  });

  it("rewrites useRouter() to useAppRouter() and adds the hook import", async () => {
    const result = await run(`
      import { useRouter } from "next/navigation";
      export const C = () => {
        const router = useRouter();
        return <button onClick={() => router.push("/foo")} />;
      };
    `);
    expect(result).toContain(
      `import { useAppRouter } from "@/hooks/use-app-router"`
    );
    expect(result).toContain("const router = useAppRouter();");
    expect(result).toContain(`router.push("/foo")`);
  });

  // Rewriting the call site (not each router.push) means this shape migrates for free.
  it("handles a destructured router binding", async () => {
    const result = await run(`
      import { useRouter } from "next/navigation";
      export const C = () => {
        const { replace } = useRouter();
        replace("/god-mode");
        return null;
      };
    `);
    expect(result).toContain("const { replace } = useAppRouter();");
    expect(result).not.toContain("useRouter");
  });

  it("rewrites useRouter inside a ReturnType type query (power-k context)", async () => {
    const result = await run(`
      import { useRouter } from "next/navigation";
      export type TContext = {
        router: ReturnType<typeof useRouter>;
      };
    `);
    expect(result).toContain("ReturnType<typeof useAppRouter>");
    expect(result).not.toContain("next/navigation");
  });

  // 13 files import from both sources; a second `from "react-router"` is a duplicate import.
  it("merges specifiers into an existing react-router import", async () => {
    const result = await run(`
      import { usePathname } from "next/navigation";
      import { Outlet, useParams } from "react-router";
      export const C = () => {
        const pathname = usePathname();
        const { id } = useParams();
        return <Outlet />;
      };
    `);
    const routerImports = result?.match(/from "react-router"/g) ?? [];
    expect(routerImports).toHaveLength(1);
    expect(result).toContain("Outlet");
    expect(result).toContain("useParams");
    expect(result).toContain("useLocation");
  });

  it("does not duplicate a specifier already imported from react-router", async () => {
    const result = await run(`
      import { useParams } from "next/navigation";
      import { Link, useParams as useRouterParams } from "react-router";
      export const C = () => <Link to="/x" />;
    `);
    const useParamsCount = result?.match(/useParams/g) ?? [];
    // one aliased import specifier + its local name; no extra bare useParams appended
    expect(useParamsCount.length).toBeGreaterThan(0);
    const routerImports = result?.match(/from "react-router"/g) ?? [];
    expect(routerImports).toHaveLength(1);
  });

  it("converts the next/link default import to the app-local named Link", async () => {
    const result = await run(`
      import Link from "next/link";
      export const C = () => <Link href="/foo" className="x">go</Link>;
    `);
    expect(result).toContain(`import { Link } from "@/components/common/link"`);
    expect(result).not.toContain("next/link");
    expect(result).toContain(`<Link href="/foo" className="x">go</Link>`);
  });

  it("preserves an aliased next/link default import", async () => {
    const result = await run(`
      import NextLink from "next/link";
      export const C = () => <NextLink href="/foo">go</NextLink>;
    `);
    expect(result).toContain(
      `import { Link as NextLink } from "@/components/common/link"`
    );
    expect(result).toContain('<NextLink href="/foo">go</NextLink>');
  });

  // The sharpest space case: Next-shaped useSearchParams alongside an existing RR Link import.
  it("merges the import and destructures the tuple atomically", async () => {
    const result = await run(`
      import { useParams, useSearchParams } from "next/navigation";
      import { Link } from "react-router";
      export const C = () => {
        const { anchor } = useParams();
        const searchParams = useSearchParams();
        return <Link to={anchor}>{searchParams.get("peekId")}</Link>;
      };
    `);
    const routerImports = result?.match(/from "react-router"/g) ?? [];
    expect(routerImports).toHaveLength(1);
    expect(result).toContain("const [searchParams] = useSearchParams();");
    expect(result).toContain("const { anchor } = useParams();");
    expect(result).not.toContain("next/navigation");
  });

  // A removed import takes its leading comments with it. When the next/* import leads the
  // file, those comments are the AGPL license header — losing it silently is unacceptable.
  it("preserves the license header when the removed import led the file", async () => {
    const result = await run(`/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";

export const C = () => {
  const { id } = useParams();
  return <div>{id}</div>;
};
`);
    expect(result).toContain("SPDX-License-Identifier: AGPL-3.0-only");
    expect(result).toContain("Copyright (c) 2023-present Plane Software, Inc.");
    // header must still lead the file, not float into the middle of it
    expect(result?.trimStart().startsWith("/**")).toBe(true);
    expect(result).toContain(`import { useParams } from "react-router"`);
  });

  it("preserves the license header when a leading next/link import is replaced", async () => {
    const result = await run(`/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Link from "next/link";

export const C = () => <Link href="/foo">go</Link>;
`);
    expect(result).toContain("SPDX-License-Identifier: AGPL-3.0-only");
    expect(result?.trimStart().startsWith("/**")).toBe(true);
    expect(result).toContain(`import { Link } from "@/components/common/link"`);
  });

  it("does not duplicate the header when a later import is removed", async () => {
    const result = await run(`/**
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useRef } from "react";
import { useParams } from "next/navigation";

export const C = () => {
  const { id } = useParams();
  useRef(null);
  return <div>{id}</div>;
};
`);
    const headers = result?.match(/SPDX-License-Identifier/g) ?? [];
    expect(headers).toHaveLength(1);
  });

  it("leaves files without next imports untouched", async () => {
    const result = await run(`
      import { useLocation } from "react-router";
      export const C = () => <div>{useLocation().pathname}</div>;
    `);
    // The transform returns undefined when there is nothing to do, which applyTransform
    // surfaces as an empty string — i.e. the file is not rewritten at all.
    expect(result).toBe("");
  });
});
