/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { coreRoutes } from "./routes/core";
import { extendedRoutes } from "./routes/extended";
import { mergeRoutes } from "./routes/helper";

/**
 * Main Routes Configuration
 * This file serves as the entry point for the route configuration.
 *
 * Every route nests under the pathless app/layout.tsx shell; root.tsx stays
 * shell-thin (see the note in app/root.tsx).
 */
const mergedRoutes: RouteConfigEntry[] = mergeRoutes(coreRoutes, extendedRoutes);

// Add catch-all route at the end (404 handler)
const routes: RouteConfigEntry[] = [layout("./layout.tsx", [...mergedRoutes, route("*", "./not-found.tsx")])];

export default routes;
