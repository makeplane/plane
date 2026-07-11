/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type {
  API,
  ASTPath,
  FileInfo,
  ImportDeclaration,
  Options,
} from "jscodeshift";

/**
 * Repoints `useParams` from `react-router` to the app-local `useParams` wrapper.
 *
 * React Router types route params as `string | undefined`. The app's call sites read params their
 * own route declares and index straight into the record, so they rely on the stricter
 * `Record<string, string>` contract the app wrapper provides.
 *
 * Only the import source moves; call sites are untouched. Files that already import from the
 * wrapper, or that alias the hook, are left alone.
 *
 * Options:
 *   --paramsImport=@/hooks/use-params   module exporting the useParams wrapper
 */
export default function transform(
  file: FileInfo,
  api: API,
  options: Options
): string | undefined {
  const j = api.jscodeshift;
  const root = j(file.source);

  const paramsImport: string = options.paramsImport ?? "@/hooks/use-params";
  const ROUTER_SOURCE = "react-router";

  // Never rewrite the wrapper itself — it must keep importing from react-router.
  if (file.path?.includes("use-params")) return undefined;

  let didTransform = false;

  root
    .find(j.ImportDeclaration, { source: { value: ROUTER_SOURCE } })
    .forEach((path: ASTPath<ImportDeclaration>) => {
      const decl = path.node;
      const specifiers = decl.specifiers ?? [];

      const paramsSpec = specifiers.find(
        (s) =>
          s.type === "ImportSpecifier" &&
          (s as { imported: { name: string } }).imported.name === "useParams"
      );
      if (!paramsSpec) return;

      // Keep the local binding name so aliased imports (`useParams as useRouterParams`) still work.
      const localName =
        (paramsSpec as { local?: { name: string } }).local?.name ?? "useParams";

      const remaining = specifiers.filter((s) => s !== paramsSpec);
      const newSpecifier =
        localName === "useParams"
          ? j.importSpecifier(j.identifier("useParams"))
          : j.importSpecifier(
              j.identifier("useParams"),
              j.identifier(localName)
            );
      const wrapperImport = j.importDeclaration(
        [newSpecifier],
        j.literal(paramsImport)
      );

      if (remaining.length > 0) {
        // Other react-router specifiers stay put; add the wrapper import alongside.
        decl.specifiers = remaining;
        j(path).insertAfter(wrapperImport);
      } else {
        // useParams was the only specifier — replace the whole declaration, carrying comments
        // (a leading license header) across with it.
        wrapperImport.comments = decl.comments ?? null;
        j(path).replaceWith(wrapperImport);
      }

      didTransform = true;
    });

  if (!didTransform) return undefined;

  return root.toSource({ quote: "double" });
}
