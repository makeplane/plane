import React from "react";
import { observer } from "mobx-react";
import { RefreshCw } from "lucide-react";
// types
import { TNameDescriptionLoader } from "@plane/types";

type Props = {
  isSubmitting: TNameDescriptionLoader;
};

export const NameDescriptionUpdateStatus: React.FC<Props> = observer((props) => {
  const { isSubmitting } = props;

  return (
    <>
      <div
        className={`flex items-center gap-x-2 transition-all duration-300 ${
          isSubmitting === "saved" ? "fade-out" : "fade-in"
        }`}
      >
        {isSubmitting !== "submitted" && isSubmitting !== "saved" && (
          <RefreshCw className="animate-spin size-3.5 stroke-custom-text-300" />
        )}
        <span className="text-sm text-custom-text-300">{isSubmitting === "submitting" ? "Saving..." : "Saved"}</span>
      </div>
    </>
  );
});
