// react
import React, { useState } from "react";

// next
import { useRouter } from "next/router";

// hooks
import useToast from "hooks/use-toast";

// icons
import { ChevronDown } from "lucide-react";

// components
import { ExistingIssuesListModal } from "components/core";

// types
import { BlockeIssueDetail, ISearchIssueResponse } from "types";

type Props = {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
};

export const BlockedSelect: React.FC<Props> = (props) => {
  const { value, onChange, disabled = false } = props;

  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);

  const router = useRouter();
  const { issueId } = router.query;

  const { setToastAlert } = useToast();

  const onSubmit = async (data: ISearchIssueResponse[]) => {
    if (data.length === 0) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Please select at least one issue.",
      });

      return;
    }

    const selectedIssues: { blocker_issue_detail: BlockeIssueDetail }[] = data.map((i) => ({
      blocker_issue_detail: {
        id: i.id,
        name: i.name,
        sequence_id: i.sequence_id,
        project_detail: {
          id: i.project_id,
          identifier: i.project__identifier,
          name: i.project__name,
        },
      },
    }));

    onChange([...(value || []), ...selectedIssues]);

    setIsBlockedModalOpen(false);
  };

  return (
    <>
      <ExistingIssuesListModal
        isOpen={isBlockedModalOpen}
        handleClose={() => setIsBlockedModalOpen(false)}
        searchParams={{ issue_relation: true, issue_id: issueId!.toString() }}
        handleOnSubmit={onSubmit}
        workspaceLevelToggle
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsBlockedModalOpen(true)}
        className={
          "relative w-full px-2.5 py-0.5 text-base flex justify-between items-center gap-0.5 text-custom-text-100"
        }
      >
        <span className="text-custom-text-200">Select issue</span>
        <ChevronDown className="w-4 h-4 text-custom-text-200" />
      </button>
    </>
  );
};
