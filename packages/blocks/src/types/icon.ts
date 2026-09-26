/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactElement } from "react";

/**
 * Icon element accepted by components that `cloneElement` it to inject sizing.
 * The props must be declared: React 19 types default `ReactElement["props"]` to
 * `unknown`, so a bare `ReactElement` rejects the cloned `className`/`strokeWidth`.
 */
export type IconElement = ReactElement<{ className?: string; strokeWidth?: number }>;
