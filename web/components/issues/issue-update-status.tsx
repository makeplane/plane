import React from "react";
import { RefreshCw } from "lucide-react";
// types
import { IIssue } from "types";

type Props = {
  isSubmitting: "submitting" | "submitted" | "saved";
  issueDetail?: IIssue;
};

export const IssueUpdateStatus: React.FC<Props> = (props) => {
  const { isSubmitting, issueDetail } = props;
  return (
    <>
      {issueDetail && (
        <h4 className="mr-4 text-lg font-medium text-custom-text-300">
          {issueDetail.project_detail?.identifier}-{issueDetail.sequence_id}
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
