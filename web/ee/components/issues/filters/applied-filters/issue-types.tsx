"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { X } from "lucide-react";
// plane web components
import { IssueTypeLogo } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedIssueTypeFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values, editable } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { isIssueTypeEnabledForProject, getIssueTypeById } = useIssueTypes();
  // derived values
  const isIssueTypeDisplayEnabled = isIssueTypeEnabledForProject(
    workspaceSlug?.toString(),
    projectId?.toString(),
    "ISSUE_TYPE_DISPLAY"
  );

  // Return null if issue type is not enabled for the project
  if (!isIssueTypeDisplayEnabled) return null;

  return (
    <>
      {values.map((issueTypeId) => {
        const issueType = getIssueTypeById(issueTypeId);
        if (!issueType) return null;
        return (
          <div
            key={issueTypeId}
            className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs truncate"
          >
            <IssueTypeLogo
              icon_props={issueType?.logo_props?.icon}
              size={10}
              containerSize={16}
              isDefault={issueType?.is_default}
            />
            <span className="normal-case truncate">{issueType.name}</span>
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                onClick={() => handleRemove(issueTypeId)}
              >
                <X size={10} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
});
