import { observer } from "mobx-react";
import type { TIssue } from "@plane/types";
import { Row } from "@plane/ui";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: Record<string, unknown>) => void;
  disabled: boolean;
};

export const SpreadsheetProjectLeadColumn = observer(function SpreadsheetProjectLeadColumn({ issue }: Props) {
  const { getProjectById } = useProject();
  const { getUserDetails } = useMember();

  const project = issue.project_id ? getProjectById(issue.project_id) : null;
  const projectLead = project?.project_lead;

  // project_lead can be IUserLite (nested object) or a user id string
  let displayName = "—";
  if (projectLead) {
    if (typeof projectLead === "string") {
      const user = getUserDetails(projectLead);
      displayName = user?.display_name ?? user?.email ?? "—";
    } else {
      displayName = projectLead.display_name ?? projectLead.email ?? "—";
    }
  }

  return (
    <Row className="flex h-11 w-full cursor-default items-center border-b-[0.5px] border-subtle px-2 text-11 hover:bg-layer-1 group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10">
      <span className="truncate text-secondary">{displayName}</span>
    </Row>
  );
});
