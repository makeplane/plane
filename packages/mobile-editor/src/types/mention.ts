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

export type TMemberResponse = {
  id?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
};

export type TPageMentionResponse = {
  workitem: TWorkItemMentionResponse;
};

export type TWorkItemMentionResponse = {
  id: string | undefined;
  name: string | undefined;
  sequenceId: string | undefined;
  projectId: string | undefined;
  typeId: string | undefined;
  projectIdentifier: string | undefined;
  stateGroup: string | undefined;
  stateName: string | undefined;
};
