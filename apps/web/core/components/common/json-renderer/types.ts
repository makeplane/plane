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
 * Core types for the custom JSON UI renderer.
 *
 * These types define the JSON spec shape produced by the backend
 * and consumed by the frontend `Renderer` component.
 */

import type { FC } from "react";

// ============================================================
// JSON UI Spec (the shape the backend sends)
// ============================================================

/** A single element in the spec's `elements` map. */
export type TElementSpec = {
  /** Component type key — must match a key in the registry. */
  type: string;
  /** Props passed to the component. */
  props: Record<string, unknown>;
  /** Optional ordered list of child element keys (for nested layouts). */
  children?: string[];
};

/** Top-level JSON UI specification. */
export type TJsonUISpec = {
  /** Key of the root element in the `elements` map. */
  root: string;
  /** Map of element id → element spec. */
  elements: Record<string, TElementSpec>;
};

// ============================================================
// Component Renderer
// ============================================================

/** Props received by every registered component renderer. */
export type TComponentRendererProps<P = Record<string, unknown>> = {
  props: P;
  emit?: (event: string, payload?: unknown) => void;
  children?: React.ReactNode;
};

/** A React component that renders a single JSON UI element. */
export type TComponentRenderer<P = Record<string, unknown>> = FC<TComponentRendererProps<P>>;

// ============================================================
// Catalog
// ============================================================

/** A single entry in the catalog. */
export type TCatalogEntry = {
  /** Zod schema for the component's props. */
  props: unknown;
  /** Human-readable description (used for AI prompt generation). */
  description: string;
};

/** Full catalog definition. */
export type TCatalog = {
  components: Record<string, TCatalogEntry>;
  actions: Record<string, unknown>;
};

// ============================================================
// Registry
// ============================================================

/** A map of component type names to their React renderers. */
export type TComponentMap = Record<string, TComponentRenderer<never>>;

/** Registry wrapping the component map. */
export type TRegistry<T extends TComponentMap = TComponentMap> = {
  components: T;
};
