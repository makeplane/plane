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

/**
 * Custom JSON UI Renderer
 *
 * Drop-in replacement for @json-render/core + @json-render/react.
 * Provides:
 *   - `defineCatalog`  — creates a typed catalog from Zod schemas
 *   - `defineRegistry` — maps catalog components to React implementations
 *   - `JSONUIProvider` — React context that holds the registry
 *   - `Renderer`       — renders a JSON UI spec using the registry
 */

import React, { createContext, useContext } from "react";
// local imports
import type { TCatalog, TComponentMap, TComponentRenderer, TJsonUISpec, TRegistry } from "@plane/types";

// ============================================================
// defineCatalog
// ============================================================

/**
 * Creates a catalog of components and actions.
 *
 * @param config - Object with `components` (Zod schema + description per component) and `actions`.
 * @returns The catalog object.
 */
export function defineCatalog(config: TCatalog): TCatalog {
  return config;
}

// ============================================================
// defineRegistry
// ============================================================

/**
 * Creates a registry that maps component names to React implementations.
 *
 * @param _catalog - The catalog (documents which components exist).
 * @param implementations - Object with a `components` map of React renderers.
 * @returns `{ registry }` — the resolved registry.
 */
export function defineRegistry<T extends TComponentMap>(
  _catalog: TCatalog,
  implementations: { components: T }
): { registry: TRegistry<T> } {
  return { registry: implementations };
}

// ============================================================
// JSONUIProvider (React context)
// ============================================================

const RegistryContext = createContext<TRegistry | null>(null);

/**
 * Provides the registry to the component tree.
 */
export const JSONUIProvider: React.FC<{
  registry: TRegistry;
  children: React.ReactNode;
}> = ({ registry, children }) => <RegistryContext.Provider value={registry}>{children}</RegistryContext.Provider>;

// ============================================================
// Renderer
// ============================================================

/**
 * Renders a JSON UI spec by resolving each element against the registry.
 *
 * Supports nested elements via the optional `children` array on each element spec.
 */
export const Renderer: React.FC<{
  spec: TJsonUISpec;
  registry?: TRegistry;
}> = ({ spec, registry: registryProp }) => {
  const registryFromContext = useContext(RegistryContext);
  const registry = registryProp ?? registryFromContext;

  if (!registry || !spec || !spec.root || !spec.elements) return null;

  const renderElement = (elementKey: string): React.ReactNode => {
    const element = spec.elements[elementKey];
    if (!element || !element.type) return null;

    const Component = registry.components[element.type] as TComponentRenderer | undefined;
    if (!Component) {
      console.warn(`[JSONUIRenderer] Unknown component type: "${element.type}"`);
      return null;
    }

    // Recursively render children if present
    const childNodes = element.children?.map((childKey) => (
      <React.Fragment key={childKey}>{renderElement(childKey)}</React.Fragment>
    ));

    return (
      <Component key={elementKey} props={element.props}>
        {childNodes}
      </Component>
    );
  };

  return <>{renderElement(spec.root)}</>;
};
