"use client";

import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
// plane package imports
import { E_SORT_ORDER, EActivityFilterType, filterActivityOnSelectedFilters } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
// components
import { TIssueComment } from "@plane/types";
import { CommentsWrapper } from "@/components/comments";
import { ActivitySortRoot } from "@/components/issues/issue-detail/issue-activity";
// hooks
import { SidebarContentWrapper } from "@/plane-web/components/common/layout/sidebar/content-wrapper";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiativeActivityComment } from "@/plane-web/types/initiative";
import { useCommentOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const InitiativeSidebarCommentsRoot: FC<Props> = observer((props) => {
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
      actionElement={
        <ActivitySortRoot
          sortOrder={sortOrder ?? E_SORT_ORDER.ASC}
          toggleSort={toggleSortOrder}
          className="flex-shrink-0"
          iconClassName="size-3"
        />
      }
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
