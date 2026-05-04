/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createContext } from "react";
import type { PropagationCallbacks } from "../blockResizables/use-gantt-resizable";

/**
 * React Context plumbing the Phase 5 D-03b propagation callbacks from the
 * Issue Gantt root (`BaseGanttRoot`) down to `GanttChartBlock`'s drag hook
 * (`useGanttResizable`). The chain crosses the CE boundary
 * (`apps/web/ce/components/gantt-chart/blocks/blocks-list.tsx`) which Phase 5
 * must not modify (D-10a), so the prop-chain plumbing (Option A) is replaced
 * by a context provider (Option B).
 *
 * Module / Cycle / Project Gantt roots do NOT wrap their `<GanttChartRoot>` in
 * this provider, so the default `null` reaches `useGanttResizable` and every
 * propagation hook call is silently skipped (D-03b).
 */
export const PropagationCallbacksContext = createContext<PropagationCallbacks | null>(null);
