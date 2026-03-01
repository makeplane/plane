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
import React, { useMemo } from "react";
import { observer } from "mobx-react";
// plane package imports
import { E_SORT_ORDER, EActivityFilterType, filterActivityOnSelectedFilters } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
// components
import type { TIssueComment } from "@plane/types";
import { CommentsWrapper } from "@/components/comments";
import { ActivitySortRoot } from "@/components/issues/issue-detail/issue-activity";
// hooks
import { SidebarContentWrapper } from "@/components/common/layout/sidebar/content-wrapper";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiativeActivityComment } from "@/types/initiative";
import { useCommentOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const InitiativeSidebarCommentsRoot = observer(function InitiativeSidebarCommentsRoot(props: Props) {
  const { workspaceSlug, initiativeId, disabled = false } = props;
  // states
  const { storedValue: sortOrder, setValue: setSortOrder } = useLocalStorage<E_SORT_ORDER>(
    "initiative_comments_sort_order",
    E_SORT_ORDER.ASC
  );

  // Use your custom hook to get the operations
  const activityOperations = useCommentOperations(workspaceSlug, initiativeId);

  // store hooks
  const {
    initiative: {
      initiativeCommentActivities: { getActivityAndCommentByIssueId },
    },
  } = useInitiatives();

  // translation
  const { t } = useTranslation();

  // derived values
  const activityComments = getActivityAndCommentByIssueId(initiativeId);

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments ?? [], [
    EActivityFilterType.COMMENT,
  ]);

  // handlers
  const toggleSortOrder = () => setSortOrder(sortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC);

  const sortedActivity = useMemo(
    () =>
      filteredActivityComments
        ? sortOrder === E_SORT_ORDER.DESC
          ? [...filteredActivityComments].reverse()
          : filteredActivityComments
        : [],
    [sortOrder, filteredActivityComments]
  );

  return (
    <SidebarContentWrapper
      title={t("common.comments")}
      actionElement={<ActivitySortRoot sortOrder={sortOrder ?? E_SORT_ORDER.ASC} toggleSort={toggleSortOrder} />}
    >
      <CommentsWrapper
        entityId={initiativeId}
        activityOperations={activityOperations}
        comments={sortedActivity
          .filter((activityComment) => activityComment.activity_type === "COMMENT")
          .map((activityComment) => (activityComment as TInitiativeActivityComment).detail as TIssueComment)}
        sortOrder={sortOrder ?? E_SORT_ORDER.ASC}
        isEditingAllowed={!disabled}
        showCopyLinkOption={false}
      />
    </SidebarContentWrapper>
  );
});
