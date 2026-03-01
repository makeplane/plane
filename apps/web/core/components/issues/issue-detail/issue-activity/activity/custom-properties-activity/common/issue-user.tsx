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

import type { FC } from "react";
import Link from "next/link";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web hooks

type TIssueUser = {
  activityId: string;
};

export function IssueUser(props: TIssueUser) {
  const { activityId } = props;
  // hooks
  const {
    activity: {
      issuePropertiesActivity: { getPropertyActivityById },
    },
  } = useIssueDetail();

  const { getWorkspaceById } = useWorkspace();
  // derived values
  const activityDetail = getPropertyActivityById(activityId);
  if (!activityDetail || !activityDetail.workspace || !activityDetail.actor) return <></>;
  const workspaceDetail = getWorkspaceById(activityDetail.workspace);

  return (
    <>
      <Link
        href={`/${workspaceDetail?.slug}/profile/${activityDetail.actor_detail?.id}`}
        className="hover:underline text-primary font-medium"
      >
        {activityDetail.actor_detail?.display_name}
      </Link>
    </>
  );
}
