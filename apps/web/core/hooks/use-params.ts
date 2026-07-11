/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams as useRouterParams } from "react-router";

/**
 * Route params, keyed by the segment names declared in the route config.
 *
 * React Router types every param as `string | undefined`, because a param is genuinely absent
 * on routes that do not declare it. Call sites here read params they know their own route
 * declares (`workspaceSlug` inside a `:workspaceSlug` subtree), so they index straight into the
 * record. This wrapper keeps that contract in one place rather than making several hundred call
 * sites assert non-null individually.
 *
 * Reading a param that the current route does not declare still yields `undefined` at runtime,
 * so prefer destructuring only the params the route actually has.
 */
export const useParams = <T extends Record<string, string> = Record<string, string>>(): T => useRouterParams() as T;
