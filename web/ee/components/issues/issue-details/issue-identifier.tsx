import { observer } from "mobx-react";
// ui
import { LayersIcon, Logo } from "@plane/ui";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";

type TIssueIdentifierProps = {
  issueId: string;
  projectId: string;
};

export const IssueIdentifier: React.FC<TIssueIdentifierProps> = observer((props) => {
  const { issueId, projectId } = props;
  // store hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issue = getIssueById(issueId);
  const projectDetails = getProjectById(projectId);
  // plane web hooks
  const issueType = useIssueType(issue?.type_id);

  return (
    <div className="flex items-center space-x-2">
      <div className="flex-shrink-0 grid h-5 w-5 place-items-center rounded bg-custom-background-80">
        {issueType?.logo_props?.in_use ? (
          <Logo logo={issueType.logo_props} size={12} type="lucide" />
        ) : (
          <LayersIcon className="h-3 w-3 text-custom-text-300" />
        )}
      </div>
      <span className="text-base font-medium text-custom-text-300">
        {projectDetails?.identifier}-{issue?.sequence_id}
      </span>
    </div>
  );
});
