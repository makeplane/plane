/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssue } from "@plane/types";
import { getIssueIds } from "@/store/issue/helpers/base-issues-utils";

export const workItemSortWithOrderByExtended = (array: TIssue[], key?: string) => getIssueIds(array);
