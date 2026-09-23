/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export * from "./asset-registry";
export * from "./asset-types";
export * from "./helper";

// NOTE: The illustration component barrels (./horizontal-stack, ./illustration, ./vertical-stack)
// are intentionally NOT re-exported here. They are heavy inline-SVG components consumed exclusively
// through the lazily code-split registries in ./asset-registry. Re-exporting them from this public
// entry would mark every illustration as a used export, defeating the code-splitting and pulling
// all ~50 illustrations back into whichever chunk an empty-state component lands in.
