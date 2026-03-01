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

import { observer } from "mobx-react";
import { CircleDot, XCircle } from "lucide-react";
// plane imports
import { ERelationType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { Loader } from "@plane/ui";
import { ListLayout } from "@/components/core/list/list-root";
// plane web hooks
import { SectionEmptyState } from "@/components/common/layout/main/common/empty-state";
import { useTeamspaceAnalytics } from "@/plane-web/hooks/store/teamspaces/use-teamspace-analytics";
// local imports
import { TeamspaceRelationIssueListItem } from "./list-item";

type TTeamspaceRelationIssueListProps = {
  teamspaceId: string;
  type: ERelationType;
};

export const TeamspaceRelationIssueList = observer(function TeamspaceRelationIssueList(
  props: TTeamspaceRelationIssueListProps
) {
  const { teamspaceId, type } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getTeamspaceRelationsLoader, getTeamspaceRelations } = useTeamspaceAnalytics();
  // derived values
  const teamspaceRelationsLoader = getTeamspaceRelationsLoader(teamspaceId);
  const teamspaceRelations = getTeamspaceRelations(teamspaceId);
  // derived values
  const isLoading = teamspaceRelationsLoader === "init-loader";
  const currentDependencyIssue =
    type === ERelationType.BLOCKING ? teamspaceRelations?.blocking_issues : teamspaceRelations?.blocked_by_issues;

  // Loading state
  if (isLoading) {
    return (
      <Loader className="w-full h-full flex flex-col gap-2">
        <Loader.Item height="44px" />
        <Loader.Item height="44px" />
        <Loader.Item height="44px" />
      </Loader>
    );
  }

  // Empty state
  if (!currentDependencyIssue || currentDependencyIssue.length === 0) {
    return (
      <SectionEmptyState
        heading={
          type === ERelationType.BLOCKING
            ? t("teamspace_analytics.empty_state.relation.blocking.title")
            : t("teamspace_analytics.empty_state.relation.blocked.title")
        }
        subHeading={
          type === ERelationType.BLOCKING
            ? t("teamspace_analytics.empty_state.relation.blocking.description")
            : t("teamspace_analytics.empty_state.relation.blocked.description")
        }
        icon={
          type === ERelationType.BLOCKING ? (
            <XCircle className="size-8 text-placeholder" />
          ) : (
            <CircleDot className="size-8 text-placeholder" />
          )
        }
        variant="solid"
        iconVariant="round"
        size="md"
        contentClassName="gap-1"
      />
    );
  }

  return (
    <ListLayout>
      {currentDependencyIssue.map((issue) => (
        <TeamspaceRelationIssueListItem key={issue.id} issue={issue} type={type} />
      ))}
    </ListLayout>
  );
});
