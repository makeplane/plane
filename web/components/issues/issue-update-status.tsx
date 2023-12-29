import React from "react";
import { RefreshCw } from "lucide-react";
// types
import { TIssue } from "@plane/types";
import { useProject } from "hooks/store";

type Props = {
  isSubmitting: "submitting" | "submitted" | "saved";
  issueDetail?: TIssue;
};

export const IssueUpdateStatus: React.FC<Props> = (props) => {
  const { isSubmitting, issueDetail } = props;
  // hooks
  const { getProjectById } = useProject();

  return (
    <>
      {issueDetail && (
        <h4 className="mr-4 text-lg font-medium text-custom-text-300">
          {getProjectById(issueDetail.project_id)?.identifier}-{issueDetail.sequence_id}
        </h4>
      )}
      <div
        className={`flex items-center gap-x-2 transition-all duration-300 ${
          isSubmitting === "saved" ? "fadeOut" : "fadeIn"
        }`}
      >
        {isSubmitting !== "submitted" && isSubmitting !== "saved" && (
          <RefreshCw className="h-4 w-4 stroke-custom-text-300" />
        )}
        <span className="text-sm text-custom-text-300">{isSubmitting === "submitting" ? "Saving..." : "Saved"}</span>
      </div>
    </>
  );
};
