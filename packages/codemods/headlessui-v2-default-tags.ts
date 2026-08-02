/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API, FileInfo, JSXOpeningElement, Options } from "jscodeshift";

/**
 * Headless UI v1 -> v2 default-tag preservation.
 *
 * v2 changed the element some components render by default. Every call site that relied on
 * the v1 default therefore silently changes its DOM — it still compiles and still runs, so
 * nothing catches it but the eye. Adding an explicit `as=` at those sites pins the emitted
 * markup to what v1 produced.
 *
 * Derived by diffing the `defaultTag` values in the v1.7.19 and v2.2.10 dist bundles:
 *
 *   bare <Transition>   div      -> Fragment   =>  as="div"
 *   Combobox.Options    ul       -> div        =>  as="ul"
 *   Combobox.Option     li       -> div        =>  as="li"
 *   Listbox.Options     ul       -> div        =>  as="ul"
 *   Listbox.Option      li       -> div        =>  as="li"
 *   Tab.Group           Fragment -> div        =>  as={Fragment}
 *
 * Menu.*, Dialog.*, Disclosure.*, Popover.*, Switch and RadioGroup are byte-identical
 * between the two versions and are deliberately left alone.
 */

type AsValue = { kind: "string"; value: string } | { kind: "fragment" };

/** Keyed by `<Object>.<Property>` as written in JSX. */
const MEMBER_TARGETS: Record<string, AsValue> = {
  "Combobox.Options": { kind: "string", value: "ul" },
  "Combobox.Option": { kind: "string", value: "li" },
  "Listbox.Options": { kind: "string", value: "ul" },
  "Listbox.Option": { kind: "string", value: "li" },
  "Tab.Group": { kind: "fragment" },
};

/** Keyed by the bare JSX identifier. */
const IDENTIFIER_TARGETS: Record<string, AsValue> = {
  Transition: { kind: "string", value: "div" },
};

export default function transform(file: FileInfo, api: API, options: Options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Only rewrite components this file actually imports from Headless UI — the repo has
  // first-party components sharing these names (e.g. its own <Transition> wrappers).
  // Map local name -> imported name so aliases such as `Popover as HeadlessReactPopover`
  // still resolve to the Headless UI component they came from.
  const importedNameByLocal = new Map<string, string>();
  root.find(j.ImportDeclaration, { source: { value: "@headlessui/react" } }).forEach((path) => {
    for (const specifier of path.node.specifiers ?? []) {
      if (specifier.type === "ImportSpecifier" && specifier.local) {
        importedNameByLocal.set(specifier.local.name, specifier.imported.name as string);
      }
    }
  });

  if (importedNameByLocal.size === 0) return file.source;

  let mutations = 0;
  let usedFragment = false;

  const resolveTarget = (node: JSXOpeningElement["name"]): AsValue | undefined => {
    if (node.type === "JSXMemberExpression") {
      const object = node.object;
      if (object.type !== "JSXIdentifier") return undefined;
      const importedName = importedNameByLocal.get(object.name);
      if (!importedName) return undefined;
      return MEMBER_TARGETS[`${importedName}.${node.property.name}`];
    }
    if (node.type === "JSXIdentifier") {
      const importedName = importedNameByLocal.get(node.name);
      if (!importedName) return undefined;
      return IDENTIFIER_TARGETS[importedName];
    }
    return undefined;
  };

  root.find(j.JSXOpeningElement).forEach((path) => {
    const target = resolveTarget(path.node.name);
    if (!target) return;

    const attributes = path.node.attributes ?? [];

    // An explicit `as` already pins the tag — including when it sits on a continuation line.
    const hasExplicitAs = attributes.some(
      (attribute) => attribute.type === "JSXAttribute" && attribute.name?.name === "as"
    );
    if (hasExplicitAs) return;

    // A spread may carry `as` at runtime; setting it here would override the caller.
    const hasSpread = attributes.some((attribute) => attribute.type === "JSXSpreadAttribute");
    if (hasSpread) return;

    const value =
      target.kind === "fragment"
        ? j.jsxExpressionContainer(j.identifier("Fragment"))
        : j.literal(target.value);

    if (target.kind === "fragment") usedFragment = true;

    attributes.unshift(j.jsxAttribute(j.jsxIdentifier("as"), value));
    path.node.attributes = attributes;
    mutations += 1;
  });

  if (mutations === 0) return file.source;

  if (usedFragment) ensureFragmentImport(j, root);

  return root.toSource(options);
}

/** Adds `Fragment` to the file's react import, creating that import if it has none. */
function ensureFragmentImport(j: API["jscodeshift"], root: ReturnType<API["jscodeshift"]>) {
  const reactImports = root.find(j.ImportDeclaration, { source: { value: "react" } });

  const alreadyImported = reactImports.nodes().some((node) =>
    (node.specifiers ?? []).some(
      (specifier) => specifier.type === "ImportSpecifier" && specifier.imported.name === "Fragment"
    )
  );
  if (alreadyImported) return;

  // Prefer a value import; `import type { X } from "react"` cannot carry a runtime binding.
  const valueImport = reactImports.nodes().find((node) => node.importKind !== "type");

  if (valueImport) {
    valueImport.specifiers = valueImport.specifiers ?? [];
    valueImport.specifiers.push(j.importSpecifier(j.identifier("Fragment")));
    return;
  }

  const declaration = j.importDeclaration(
    [j.importSpecifier(j.identifier("Fragment"))],
    j.literal("react")
  );

  const firstImport = root.find(j.ImportDeclaration).at(0);
  if (firstImport.size() > 0) {
    firstImport.insertBefore(declaration);
  } else {
    root.get().node.program.body.unshift(declaration);
  }
}
