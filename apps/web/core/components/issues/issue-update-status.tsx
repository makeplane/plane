import React from "react";
import { observer } from "mobx-react";
import { RefreshCw } from "lucide-react";
// types
import type { TNameDescriptionLoader } from "@plane/types";

type Props = {
  isSubmitting: TNameDescriptionLoader;
};

export const NameDescriptionUpdateStatus = observer(function NameDescriptionUpdateStatus(props: Props) {
  const { isSubmitting } = props;

  return (
    <>
      <div
        className={`flex items-center gap-x-2 transition-all duration-300 ${
          isSubmitting === "saved" ? "fade-out" : "fade-in"
        }`}
      >
        {isSubmitting !== "submitted" && isSubmitting !== "saved" && (
          <RefreshCw className="animate-spin size-3.5 stroke-tertiary" />
        )}
        <span className="text-13 text-tertiary">{isSubmitting === "submitting" ? "Saving..." : "Saved"}</span>
      </div>
    </>
  );
});
