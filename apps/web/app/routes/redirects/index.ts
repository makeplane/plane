/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RouteConfigEntry } from "@react-router/dev/routes";
import { coreRedirectRoutes } from "./core";
import { extendedRedirectRoutes } from "./extended";

/**
 * REDIRECT ROUTES
 * Centralized configuration for all route redirects
 * Migrated from Next.js next.config.js redirects
 */
export const redirectRoutes: RouteConfigEntry[] = [...coreRedirectRoutes, ...extendedRedirectRoutes];
