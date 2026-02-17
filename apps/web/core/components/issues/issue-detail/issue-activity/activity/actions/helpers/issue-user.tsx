/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type TIssueUser = {
  activityId: string;
  customUserName?: string;
};

export function IssueUser(props: TIssueUser) {
  const { activityId, customUserName } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  return (
    <>
      {customUserName ? (
        <span className="text-primary font-medium">{customUserName}</span>
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
