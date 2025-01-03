import { observer } from "mobx-react";
// components
import { TDependencyType } from "@plane/types";
import { ListLayout } from "@/components/core/list/list-root";
// plane web hooks
import { useTeamAnalytics } from "@/plane-web/hooks/store/teams/use-team-analytics";
// local imports
import { TeamDependencyIssueListItem } from "./list-item";

type TTeamDependencyIssueListProps = {
  teamId: string;
  type: TDependencyType;
};

export const TeamDependencyIssueList = observer((props: TTeamDependencyIssueListProps) => {
  const { teamId, type } = props;
  // store hooks
  const { getTeamDependencies } = useTeamAnalytics();
  // derived values
  const teamDependencies = getTeamDependencies(teamId);
  const currentDependencyIssue =
    type === "blocked" ? teamDependencies?.blocked_by_issues : teamDependencies?.blocking_issues;

  if (!currentDependencyIssue || currentDependencyIssue.length === 0) return null;

  return (
    <ListLayout>
      {currentDependencyIssue.map((issue) => (
        <TeamDependencyIssueListItem key={issue.id} issue={issue} type={type} />
      ))}
    </ListLayout>
  );
});
