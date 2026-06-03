/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
// types
import type { TWorkspaceBaseActivity } from "@plane/types";
// store hooks
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";

type TUser = {
  activity: TWorkspaceBaseActivity;
  customUserName?: string;
};

export const User = observer(function User(props: TUser) {
  const { activity, customUserName } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const { getWorkspaceById } = useWorkspace();
  // derived values
  const actorDetail = getUserDetails(activity.actor);
  const workspaceDetail = getWorkspaceById(activity.workspace);

  return (
    <>
      {customUserName || actorDetail?.display_name.includes("-intake") ? (
        <span className="font-medium text-primary">{customUserName || "Plane"}</span>
      ) : (
        <Link
          href={`/${workspaceDetail?.slug}/profile/${actorDetail?.id}`}
          className="font-medium text-primary hover:underline"
        >
          {actorDetail?.display_name}
        </Link>
      )}
    </>
  );
});
