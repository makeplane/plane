import React from "react";
import { observer } from "mobx-react";
import { RefreshCw } from "lucide-react";

type Props = {
  isSubmitting: "submitting" | "submitted" | "saved";
};

export const IssueUpdateStatus: React.FC<Props> = observer((props) => {
  const { isSubmitting } = props;

  return (
    <>
      <div
        className={`flex items-center gap-x-2 transition-all duration-300 ${
          isSubmitting === "saved" ? "fade-out" : "fade-in"
        }`}
      >
        {isSubmitting !== "submitted" && isSubmitting !== "saved" && (
          <RefreshCw className="h-4 w-4 stroke-custom-text-300" />
        )}
        <span className="text-sm text-custom-text-300">{isSubmitting === "submitting" ? "Saving..." : "Saved"}</span>
      </div>
    </>
  );
});
