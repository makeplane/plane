/**
 * Questimus fork change (Phase 3): issue key + interactive type badge for the
 * detail/peek headers. The badge opens the type picker (PATCHes `type_id` on
 * the existing work item) when editable; display-only when disabled.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { ChevronDownIcon } from "@plane/propel/icons";
// helpers
import { getIssueKey } from "@/helpers/issue-key.helper";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useProjectIssueTypes } from "@/hooks/use-project-issue-types";
// components
import { TypeDropdown } from "@/components/dropdowns/type";
import { IssueTypeBadge } from "@/components/issues/issue-type-badge";
import { IdentifierText } from "@/components/issues/issue-detail/identifier-text";

export type TIssueTypeSwitcherProps = {
  issueId: string;
  disabled: boolean;
};

export const IssueTypeSwitcher = observer(function IssueTypeSwitcher(props: TIssueTypeSwitcherProps) {
  const { issueId, disabled } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    issue: { getIssueById },
    issueOperations,
  } = useIssueDetail();
  const { getProjectIdentifierById } = useProject();
  // derived values
  const issue = getIssueById(issueId);
  const types = useProjectIssueTypes(workspaceSlug?.toString(), issue?.project_id);
  const currentType = types.find((t) => t.id === issue?.type_id);

  if (!issue || !issue.project_id) return <></>;
  const projectIdentifier = getProjectIdentifierById(issue.project_id);

  const changeType = async (typeId: string) => {
    if (typeId === issue.type_id) return;
    await issueOperations.update(workspaceSlug?.toString() ?? "", issue.project_id, issue.id, { type_id: typeId });
  };

  return (
    <div className="flex items-center gap-2">
      <IdentifierText
        identifier={getIssueKey(projectIdentifier, issue.sequence_id)}
        size="md"
        enableClickToCopyIdentifier
      />
      {disabled ? (
        currentType && <IssueTypeBadge typeId={issue.type_id} projectId={issue.project_id} size="md" />
      ) : (
        <TypeDropdown
          value={issue.type_id}
          onChange={changeType}
          types={types}
          button={
            <span className="inline-flex items-center gap-1 rounded-full border border-custom-border-200 bg-custom-background-90 px-2 py-0.5 text-xs font-medium text-custom-text-200 hover:bg-layer-transparent-hover">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: currentType?.color ?? "#94a3b8" }} />
              {currentType?.name ?? "Type"}
              <ChevronDownIcon className="h-2.5 w-2.5" />
            </span>
          }
        />
      )}
    </div>
  );
});
