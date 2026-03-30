/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type {
  IBaseLayoutsBaseItem,
  IBaseLayoutsBaseProps,
  IBaseLayoutsBaseGroupProps,
  IBaseLayoutsBaseItemProps,
} from "./base";

export type IBaseLayoutsKanbanItem = IBaseLayoutsBaseItem;

// Main Kanban Layout Props

export interface IBaseLayoutsKanbanProps<T extends IBaseLayoutsKanbanItem> extends IBaseLayoutsBaseProps<T> {
  groupClassName?: string;
  enableAutoScroll?: boolean;
}

// Kanban Column/Group Props

export interface IBaseLayoutsKanbanGroupProps<T extends IBaseLayoutsKanbanItem> extends IBaseLayoutsBaseGroupProps<T> {
  groupClassName?: string;
}

// Kanban Card/Item Props

export type IBaseLayoutsKanbanItemProps<T extends IBaseLayoutsKanbanItem> = IBaseLayoutsBaseItemProps<T>;
