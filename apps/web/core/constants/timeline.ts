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

import type { TIssueRelationTypes } from "../types";

export const REVERSE_RELATIONS: { [key in TIssueRelationTypes]: TIssueRelationTypes } = {
  blocked_by: "blocking",
  blocking: "blocked_by",
  start_before: "start_after",
  start_after: "start_before",
  finish_before: "finish_after",
  finish_after: "finish_before",
  relates_to: "relates_to",
  duplicate: "duplicate",
  implements: "implemented_by",
  implemented_by: "implements",
};

export enum ETimelineRelation {
  FS = "FINISH_TO_START",
  SS = "START_TO_START",
  FF = "FINISH_TO_FINISH",
}

export enum EDependencyPosition {
  START = "START",
  END = "END",
}
