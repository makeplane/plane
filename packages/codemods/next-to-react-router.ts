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
 * Replaces the Next.js compatibility shims (`next/navigation`, `next/link`) with idiomatic
 * React Router equivalents.
 *
 *   useParams        -> useParams        (react-router, identical)
 *   usePathname()    -> useLocation().pathname
 *   useSearchParams  -> useSearchParams  (react-router; returns a tuple, so bindings are destructured)
 *   useRouter()      -> useAppRouter()   (app-local hook wrapping useNavigate)
 *   Link (default)   -> Link             (app-local component, named import)
 *
 * Options:
 *   --routerImport=@/hooks/use-app-router     module exporting useAppRouter
 *   --linkImport=@/components/common/link     module exporting Link (omit to leave next/link alone)
 */
export default function transform(
  file: FileInfo,
  api: API,
  options: Options
): string | undefined {
  const j = api.jscodeshift;
  const root = j(file.source);

  const routerImport: string = options.routerImport ?? "@/hooks/use-app-router";
  const linkImport: string | undefined = options.linkImport;

  const NAVIGATION_SOURCE = "next/navigation";
  const LINK_SOURCE = "next/link";
  const ROUTER_SOURCE = "react-router";

  // Named specifiers we need to add to the react-router import by the end of the run.
  const routerSpecifiersToAdd = new Set<string>();
  let needsAppRouter = false;
  let needsLocalLink = false;
  let didTransform = false;

  /** Local name a hook is bound to in this file, e.g. `usePathname as usePath`. */
  const localNameFor = (
    importedName: string,
    decl: ImportDeclaration
  ): string | undefined => {
    for (const spec of decl.specifiers ?? []) {
      if (
        spec.type === "ImportSpecifier" &&
        spec.imported.name === importedName
      ) {
        return spec.local?.name ?? importedName;
      }
    }
    return undefined;
  };

  /**
   * Detach the comments sitting above a node. A removed import takes its leading comments
   * with it, and when that import is the first statement in the file those comments are the
   * license header — so they have to be handed to whichever node ends up first instead.
   */
  const takeLeadingComments = (node: {
    comments?: unknown[] | null;
  }): unknown[] => {
    const comments = (node.comments ?? []).filter(
      (c) => (c as { leading?: boolean }).leading
    );
    node.comments = null;
    return comments;
  };

  /** Re-attach salvaged comments above the program's first remaining statement. */
  const reattachLeadingComments = (comments: unknown[]): void => {
    if (comments.length === 0) return;
    root.find(j.Program).forEach((programPath) => {
      const first = programPath.node.body[0] as
        | { comments?: unknown[] | null }
        | undefined;
      if (!first) return;
      const existing = first.comments ?? [];
      // Don't duplicate a header that is already sitting on the target node.
      const existingText = new Set(
        existing.map((c) => (c as { value: string }).value)
      );
      const salvaged = comments.filter(
        (c) => !existingText.has((c as { value: string }).value)
      );
      first.comments = [...salvaged, ...existing];
    });
  };

  // Comments rescued from imports we remove, re-attached once the dust settles.
  let orphanedComments: unknown[] = [];

  // ---------------------------------------------------------------------------
  // next/navigation
  // ---------------------------------------------------------------------------
  root
    .find(j.ImportDeclaration, { source: { value: NAVIGATION_SOURCE } })
    .forEach((path: ASTPath<ImportDeclaration>) => {
      const decl = path.node;

      const useParamsLocal = localNameFor("useParams", decl);
      const usePathnameLocal = localNameFor("usePathname", decl);
      const useSearchParamsLocal = localNameFor("useSearchParams", decl);
      const useRouterLocal = localNameFor("useRouter", decl);

      if (useParamsLocal) routerSpecifiersToAdd.add("useParams");

      // usePathname() -> useLocation().pathname
      if (usePathnameLocal) {
        routerSpecifiersToAdd.add("useLocation");
        root
          .find(j.CallExpression, {
            callee: { type: "Identifier", name: usePathnameLocal },
          })
          .forEach((callPath) => {
            j(callPath).replaceWith(
              j.memberExpression(
                j.callExpression(j.identifier("useLocation"), []),
                j.identifier("pathname")
              )
            );
          });
      }

      // React Router's useSearchParams returns [params, setParams]; the Next shim returned
      // the bare URLSearchParams. Destructure the binding so call sites keep working.
      if (useSearchParamsLocal) {
        routerSpecifiersToAdd.add("useSearchParams");
        root
          .find(j.VariableDeclarator, {
            init: {
              type: "CallExpression",
              callee: { type: "Identifier", name: useSearchParamsLocal },
            },
          })
          .forEach((declPath) => {
            const id = declPath.node.id;
            // Only rewrite the plain `const x = useSearchParams()` shape; anything already
            // destructured is left alone so we never double-wrap.
            if (id.type === "Identifier") {
              declPath.node.id = j.arrayPattern([j.identifier(id.name)]);
            }
          });
      }

      // useRouter() -> useAppRouter(). Rewriting the call (rather than each `router.push`)
      // means destructured bindings like `const { replace } = useRouter()` migrate for free.
      if (useRouterLocal) {
        needsAppRouter = true;
        root
          .find(j.CallExpression, {
            callee: { type: "Identifier", name: useRouterLocal },
          })
          .forEach((callPath) => {
            callPath.node.callee = j.identifier("useAppRouter");
          });
        // `router: ReturnType<typeof useRouter>` and friends still reference the identifier.
        root.find(j.Identifier, { name: useRouterLocal }).forEach((idPath) => {
          const parent = idPath.parent.node;
          if (
            parent.type === "TSTypeQuery" ||
            parent.type === "TSQualifiedName"
          ) {
            idPath.node.name = "useAppRouter";
          }
        });
      }

      orphanedComments = [...orphanedComments, ...takeLeadingComments(decl)];
      j(path).remove();
      didTransform = true;
    });

  // ---------------------------------------------------------------------------
  // next/link  (default import -> named import from the app-local component)
  // ---------------------------------------------------------------------------
  if (linkImport) {
    root
      .find(j.ImportDeclaration, { source: { value: LINK_SOURCE } })
      .forEach((path: ASTPath<ImportDeclaration>) => {
        const defaultSpec = (path.node.specifiers ?? []).find(
          (s) => s.type === "ImportDefaultSpecifier"
        );
        const localName = defaultSpec?.local?.name;
        if (!localName) return;

        needsLocalLink = true;
        // Preserve an aliased default import (`import NextLink from "next/link"`).
        const specifier =
          localName === "Link"
            ? j.importSpecifier(j.identifier("Link"))
            : j.importSpecifier(j.identifier("Link"), j.identifier(localName));

        const replacement = j.importDeclaration(
          [specifier],
          j.literal(linkImport)
        );
        // The replacement stays in place, so carry any header comment across with it.
        replacement.comments = path.node.comments ?? null;
        j(path).replaceWith(replacement);
        didTransform = true;
      });
  }

  if (!didTransform) return undefined;

  // ---------------------------------------------------------------------------
  // Merge the new specifiers into the file's existing react-router import, if any.
  // Emitting a second `from "react-router"` would be a duplicate-import error.
  // ---------------------------------------------------------------------------
  if (routerSpecifiersToAdd.size > 0) {
    const existing = root.find(j.ImportDeclaration, {
      source: { value: ROUTER_SOURCE },
    });

    if (existing.size() > 0) {
      const decl = existing.paths()[0].node;
      const alreadyImported = new Set(
        (decl.specifiers ?? [])
          .filter((s) => s.type === "ImportSpecifier")
          .map((s) => (s as { imported: { name: string } }).imported.name)
      );
      for (const name of routerSpecifiersToAdd) {
        if (!alreadyImported.has(name)) {
          decl.specifiers = [
            ...(decl.specifiers ?? []),
            j.importSpecifier(j.identifier(name)),
          ];
        }
      }
    } else {
      const decl = j.importDeclaration(
        [...routerSpecifiersToAdd].map((name) =>
          j.importSpecifier(j.identifier(name))
        ),
        j.literal(ROUTER_SOURCE)
      );
      insertImport(root, j, decl);
    }
  }

  if (needsAppRouter) {
    const existing = root.find(j.ImportDeclaration, {
      source: { value: routerImport },
    });
    if (existing.size() === 0) {
      insertImport(
        root,
        j,
        j.importDeclaration(
          [j.importSpecifier(j.identifier("useAppRouter"))],
          j.literal(routerImport)
        )
      );
    }
  }

  if (needsLocalLink && linkImport) {
    // The next/link rewrite above already emitted the import in place; nothing to add here.
  }

  // A removed `next/*` import that led the file carried the license header with it.
  reattachLeadingComments(orphanedComments);

  return root.toSource({ quote: "double" });
}

/** Insert an import after the last existing import, or at the top of the program. */
function insertImport(
  root: ReturnType<API["jscodeshift"]>,
  j: API["jscodeshift"],
  decl: ImportDeclaration
): void {
  const imports = root.find(j.ImportDeclaration);
  if (imports.size() > 0) {
    imports.at(imports.size() - 1).insertAfter(decl);
  } else {
    root.find(j.Program).forEach((p) => {
      p.node.body.unshift(decl);
    });
  }
}
