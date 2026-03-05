/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// CE re-exports the core navigation pane extension types directly
// EE overrides this with specific extension data types
export type {
  INavigationPaneExtension,
  INavigationPaneExtensionComponent,
  INavigationPaneExtensionProps,
} from "@/components/pages/navigation-pane";
