/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { API, FileInfo, Options } from "jscodeshift";

/**
 * Adds the codebase's established route-param guard to components that dereference a param
 * React Router types as `string | undefined`.
 *
 *   const { workspaceSlug, projectId } = useParams();
 *   ...hooks...
 *   if (!workspaceSlug || !projectId) return null;   <-- inserted
 *
 * The guard is placed after the LAST hook call in the component body, never directly after
 * useParams(): returning before a later hook would violate the rules of hooks. This mirrors the
 * existing convention (see core/components/project/project-feature-update.tsx).
 *
 * Only params named in --params are guarded, and only in the component that destructures them
 * from useParams(). Params destructured from props or form state are untouched.
 *
 * Options:
 *   --params=workspaceSlug,projectId   comma-separated params this file must guard
 */
const HOOK_RE = /^use[A-Z]/;

export default function transform(
  file: FileInfo,
  api: API,
  options: Options
): string | undefined {
  const j = api.jscodeshift;
  const root = j(file.source);

  const wanted: string[] = String(options.params ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (wanted.length === 0) return undefined;

  let didTransform = false;

  // Find the `const { a, b } = useParams();` declaration and the function body holding it.
  root
    .find(j.VariableDeclarator, {
      init: {
        type: "CallExpression",
        callee: { type: "Identifier", name: "useParams" },
      },
    })
    .forEach((declPath) => {
      const id = declPath.node.id;
      if (id.type !== "ObjectPattern") return;

      // Which of the requested params does this component actually bind?
      const bound = new Set<string>();
      for (const prop of id.properties) {
        if (prop.type === "ObjectProperty" || prop.type === "Property") {
          const key = (prop as { key: { name?: string } }).key;
          const value = (prop as { value: { type: string; name?: string } })
            .value;
          // only plain, non-renamed bindings — an alias would change the guard's identifiers
          if (
            key?.name &&
            value?.type === "Identifier" &&
            value.name === key.name &&
            wanted.includes(key.name)
          ) {
            bound.add(key.name);
          }
        }
      }
      if (bound.size === 0) return;

      // Walk up to the enclosing function body that contains this declaration.
      const fnPath =
        j(declPath).closest(j.Function).paths()[0] ??
        j(declPath).closest(j.ArrowFunctionExpression).paths()[0];
      if (!fnPath) return;

      // NEVER guard a custom hook. `return null` from a hook changes its contract (its consumers
      // destructure the result) and is itself a rules-of-hooks violation. Only components may
      // bail out of rendering. Detect the enclosing name from the function or its declarator.
      const enclosingName =
        (fnPath.node as { id?: { name?: string } }).id?.name ??
        (
          j(fnPath).closest(j.VariableDeclarator).paths()[0]?.node.id as
            | { name?: string }
            | undefined
        )?.name;
      if (enclosingName && HOOK_RE.test(enclosingName)) return;
      const body = (
        fnPath.node as { body?: { type: string; body?: unknown[] } }
      ).body;
      if (!body || body.type !== "BlockStatement" || !Array.isArray(body.body))
        return;
      const stmts = body.body as Array<Record<string, unknown>>;

      const guardIds = wanted.filter((p) => bound.has(p));

      // Already guarded? (idempotent — never stack a second guard)
      const src = j(fnPath).toSource();
      if (
        guardIds.every((p) =>
          new RegExp(`if \\([^)]*!${p}\\b[^)]*\\)\\s*return null`).test(src)
        )
      )
        return;

      // Insert AFTER the last statement that calls a hook. Returning before a later hook would
      // change the number of hooks rendered and violate the rules of hooks.
      let insertAt = 0;
      stmts.forEach((stmt, i) => {
        const text = j(stmt as never).toSource();
        // a top-level statement that invokes something matching use[A-Z]
        if (/\buse[A-Z]\w*\s*\(/.test(text) || /\buse[A-Z]\w*</.test(text))
          insertAt = i + 1;
      });

      const test = guardIds
        .map((p) => j.unaryExpression("!", j.identifier(p)))
        .reduce(
          (acc: never, cur: never) =>
            j.logicalExpression("||", acc, cur) as never
        );

      const guard = j.ifStatement(test, j.returnStatement(j.literal(null)));
      stmts.splice(insertAt, 0, guard as unknown as Record<string, unknown>);

      didTransform = true;
    });

  if (!didTransform) return undefined;
  return root.toSource({ quote: "double" });
}

// re-exported for tests
export { HOOK_RE };
