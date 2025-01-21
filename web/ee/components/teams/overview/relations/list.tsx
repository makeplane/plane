import { observer } from "mobx-react";
import { CircleDot, XCircle } from "lucide-react";
// plane imports
import { ERelationType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { Loader } from "@plane/ui";
import { ListLayout } from "@/components/core/list/list-root";
// plane web hooks
import { SectionEmptyState } from "@/plane-web/components/common";
import { useTeamAnalytics } from "@/plane-web/hooks/store/teams/use-team-analytics";
// local imports
import { TeamRelationIssueListItem } from "./list-item";

type TTeamRelationIssueListProps = {
  teamId: string;
  type: ERelationType;
};

export const TeamRelationIssueList = observer((props: TTeamRelationIssueListProps) => {
  const { teamId, type } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getTeamRelationsLoader, getTeamRelations } = useTeamAnalytics();
  // derived values
  const teamRelationsLoader = getTeamRelationsLoader(teamId);
  const teamRelations = getTeamRelations(teamId);
  // derived values
  const isLoading = teamRelationsLoader === "init-loader";
  const currentDependencyIssue =
    type === ERelationType.BLOCKING ? teamRelations?.blocking_issues : teamRelations?.blocked_by_issues;

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
            ? t("team-blocking-relation-empty-state-title")
            : t("team-blocked-relation-empty-state-title")
        }
        subHeading={
          type === ERelationType.BLOCKING
            ? t("team-blocking-relation-empty-state-description")
            : t("team-blocked-relation-empty-state-description")
        }
        icon={
          type === ERelationType.BLOCKING ? (
            <XCircle className="size-8 text-custom-text-400" />
          ) : (
            <CircleDot className="size-8 text-custom-text-400" />
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
        <TeamRelationIssueListItem key={issue.id} issue={issue} type={type} />
      ))}
    </ListLayout>
  );
});
