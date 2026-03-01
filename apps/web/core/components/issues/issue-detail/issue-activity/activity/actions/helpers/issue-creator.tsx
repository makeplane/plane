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

type TIssueUser = {
  activityId: string;
  customUserName?: string;
};

export function IssueCreatorDisplay(props: TIssueUser) {
  const { activityId, customUserName } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  const getUserName = () => {
    if (customUserName) return customUserName;
    if (activity?.source_data?.extra?.username)
      return `${activity?.source_data?.extra?.username} ${
        activity?.source_data?.source_email && `(${activity?.source_data?.source_email})`
      }`;
    if (activity?.source_data?.source_email) return activity?.source_data?.source_email;
    return "Plane";
  };
  return (
    <>
      {customUserName || ["FORMS", "EMAIL"].includes(activity?.source_data?.source) ? (
        <span className="text-primary font-medium">{getUserName()}</span>
      ) : (
        <Link
          href={`/${activity?.workspace_detail?.slug}/profile/${activity?.actor_detail?.id}`}
          className="hover:underline text-primary font-medium"
        >
          {activity.actor_detail?.display_name}
        </Link>
      )}
    </>
  );
}
