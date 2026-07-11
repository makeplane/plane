/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { applyTransform } from "@hypermod/utils";
import { describe, expect, it } from "vitest";
import * as transformer from "../guard-route-params";

const run = (source: string, params: string) =>
  applyTransform(transformer, source, { parser: "tsx" as const, params });

/** Collapse whitespace so assertions test semantics, not recast's line breaks (oxfmt reflows on commit). */
const flat = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ");

describe("guard-route-params", () => {
  it("inserts the guard after the last hook, not right after useParams", async () => {
    const result = await run(
      `
      export const C = observer(function C() {
        const { workspaceSlug, projectId } = useParams();
        const { t } = useTranslation();
        const { getProjectById } = useProject();
        return <div>{workspaceSlug.toString()}</div>;
      });
    `,
      "workspaceSlug,projectId"
    );
    // Returning before useTranslation/useProject would violate the rules of hooks.
    const lines = result!.split("\n").map((l) => l.trim());
    const guardIdx = lines.findIndex((l) => l.startsWith("if (!workspaceSlug"));
    const projIdx = lines.findIndex((l) => l.includes("useProject()"));
    expect(guardIdx).toBeGreaterThan(projIdx);
    expect(flat(result)).toContain(
      "if (!workspaceSlug || !projectId) return null;"
    );
  });

  it("only guards params the component actually binds", async () => {
    const result = await run(
      `
      export const C = observer(function C() {
        const { workspaceSlug } = useParams();
        return <div>{workspaceSlug.toString()}</div>;
      });
    `,
      "workspaceSlug,projectId,cycleId"
    );
    expect(flat(result)).toContain("if (!workspaceSlug) return null;");
    expect(result).not.toContain("projectId");
  });

  it("guards all three params when all are bound", async () => {
    const result = await run(
      `
      export const C = observer(function C() {
        const { workspaceSlug, projectId, cycleId } = useParams();
        useEffect(() => {}, []);
        return <div>{cycleId.toString()}</div>;
      });
    `,
      "workspaceSlug,projectId,cycleId"
    );
    expect(flat(result)).toContain(
      "if (!workspaceSlug || !projectId || !cycleId) return null;"
    );
  });

  it("is idempotent — never stacks a second guard", async () => {
    const already = `
      export const C = observer(function C() {
        const { workspaceSlug } = useParams();
        const { t } = useTranslation();
        if (!workspaceSlug) return null;
        return <div>{workspaceSlug.toString()}</div>;
      });
    `;
    const result = await run(already, "workspaceSlug");
    // transform reports no change
    expect(result).toBe("");
  });

  it("ignores params destructured from props, not useParams", async () => {
    const result = await run(
      `
      export const C = observer(function C(props) {
        const { workspaceSlug, projectId } = props;
        return <div>{workspaceSlug}</div>;
      });
    `,
      "workspaceSlug,projectId"
    );
    expect(result).toBe("");
  });

  it("leaves aliased useParams bindings alone", async () => {
    const result = await run(
      `
      export const C = observer(function C() {
        const { projectId: routerProjectId } = useParams();
        return <div>{routerProjectId}</div>;
      });
    `,
      "projectId"
    );
    // an alias means the guard identifiers would be wrong — skip rather than emit broken code
    expect(result).toBe("");
  });

  // Returning null from a custom hook changes its contract — consumers destructure the result,
  // so `{ columns } = useMemberColumns()` breaks. It is also a rules-of-hooks violation.
  it("refuses to guard a custom hook (arrow form)", async () => {
    const result = await run(
      `
      export const useMemberColumns = () => {
        const { workspaceSlug } = useParams();
        const { t } = useTranslation();
        const columns = [workspaceSlug];
        return { columns, workspaceSlug };
      };
    `,
      "workspaceSlug"
    );
    expect(result).toBe("");
  });

  it("refuses to guard a custom hook (function form)", async () => {
    const result = await run(
      `
      export function useProjectStuff() {
        const { projectId } = useParams();
        return { projectId };
      }
    `,
      "projectId"
    );
    expect(result).toBe("");
  });

  it("places the guard after a hook that spans multiple lines", async () => {
    const result = await run(
      `
      export const C = observer(function C() {
        const { workspaceSlug } = useParams();
        const {
          issues: { fetchIssues },
        } = useIssues(EIssuesStoreType.PROJECT);
        return <div>{workspaceSlug.toString()}</div>;
      });
    `,
      "workspaceSlug"
    );
    const lines = result!.split("\n").map((l) => l.trim());
    const guardIdx = lines.findIndex((l) => l.startsWith("if (!workspaceSlug"));
    const hookEnd = lines.findIndex((l) => l.includes("useIssues("));
    expect(guardIdx).toBeGreaterThan(hookEnd);
  });
});
