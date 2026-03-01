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

// Re-exporting from here to avoid import changes in other files
// TODO: Remove this once all the imports are updated
import { EProjectStateGroup, EProjectPriority, EProjectAccess, EProjectStateLoader } from "@plane/constants";
import type {
  TProjectStateLoader as TProjectStateLoaderExport,
  TProjectStateDraggableData as TProjectStateDraggableDataExport,
  TProjectStateGroupKey as TProjectStateGroupKeyExport,
  TProjectState as TProjectStateExport,
  TProjectStateIdsByGroup as TProjectStateIdsByGroupExport,
  TProjectStatesByGroup as TProjectStatesByGroupExport,
} from "@plane/types";

export { EProjectStateGroup, EProjectPriority, EProjectAccess, EProjectStateLoader };

export type TProjectStateLoader = TProjectStateLoaderExport;

export type TProjectStateDraggableData = TProjectStateDraggableDataExport;

export type TProjectStateGroupKey = TProjectStateGroupKeyExport;

export type TProjectState = TProjectStateExport;

export type TProjectStateIdsByGroup = TProjectStateIdsByGroupExport;

export type TProjectStatesByGroup = TProjectStatesByGroupExport;
