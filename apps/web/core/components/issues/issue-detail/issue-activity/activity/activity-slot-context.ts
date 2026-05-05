/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createContext } from "react";
import type { ReactNode } from "react";

/** Context to pass actionSlot from IssueActivityItem → IssueActivityBlockComponent
 *  without modifying all intermediate action components. */
export const ActivitySlotContext = createContext<ReactNode | undefined>(undefined);
