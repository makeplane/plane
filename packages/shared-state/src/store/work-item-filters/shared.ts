/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { EIssuesStoreType, TWorkItemFilterExpression, TWorkItemFilterProperty } from "@plane/types";
// local imports
import type { IFilterInstance } from "../rich-filters";

export type TWorkItemFilterKey = `${EIssuesStoreType}-${string}`;

export type IWorkItemFilterInstance = IFilterInstance<TWorkItemFilterProperty, TWorkItemFilterExpression>;
