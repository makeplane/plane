/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import { USER_PROFILE_ACTIVITY } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// services
import { UserService } from "@/services/user.service";
// components
import { ActivityList } from "./activity-list";
// fetch-keys

// services
const userService = new UserService();

type Props = {
  cursor: string;
  perPage: number;
  isFirstPage: boolean;
  updateResultsCount: (count: number) => void;
  updateTotalPages: (count: number) => void;
};

export function WorkspaceActivityListPage(props: Props) {
  const { cursor, perPage, isFirstPage, updateResultsCount, updateTotalPages } = props;
  // router
  const { workspaceSlug, userId } = useParams();
  // plane hooks
  const { t } = useTranslation();

  const { data: userProfileActivity } = useSWR(
    workspaceSlug && userId
      ? USER_PROFILE_ACTIVITY(workspaceSlug.toString(), userId.toString(), {
          cursor,
        })
      : null,
    workspaceSlug && userId
      ? () =>
          userService.getUserProfileActivity(workspaceSlug.toString(), userId.toString(), {
            cursor,
            per_page: perPage,
          })
      : null
  );

  useEffect(() => {
    if (!userProfileActivity) return;

    updateTotalPages(userProfileActivity.total_pages);
    updateResultsCount(userProfileActivity.results.length);
  }, [updateResultsCount, updateTotalPages, userProfileActivity]);

  if (isFirstPage && userProfileActivity?.results.length === 0)
    return (
      <EmptyStateCompact
        assetKey="activity"
        title={t("activity_empty_state.no_activity")}
        assetClassName="size-20"
        rootClassName="py-10"
      />
    );

  return <ActivityList activity={userProfileActivity} />;
}
