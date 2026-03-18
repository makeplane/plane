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

import z from "zod";

export type MergeRequestEvent =
  | "DRAFT_MR_OPENED"
  | "MR_OPENED"
  | "MR_REVIEW_REQUESTED"
  | "MR_READY_FOR_MERGE"
  | "MR_MERGED"
  | "MR_CLOSED";

const exStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.literal("to_be_created").optional(),
});

export const gitlabWorkspaceConnectionSchema = z.object({});

export const gitlabEntityConnectionSchema = z.object({
  states: z
    .object({
      mergeRequestEventMapping: z.record(z.custom<MergeRequestEvent>(), exStateSchema),
    })
    .optional(),
  skipBackwardStateMovement: z.boolean().optional(),
});
