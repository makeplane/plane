"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// plane imports
import { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  customButton?: React.ReactNode;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssueLinksActionButton: FC<Props> = observer((props) => {
  const { customButton, disabled = false, issueServiceType } = props;
  // store hooks
  const { toggleIssueLinkModal } = useIssueDetail(issueServiceType);

  // handlers
  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleIssueLinkModal(true);
  };

  return (
    <button type="button" onClick={handleOnClick} disabled={disabled}>
      {customButton ? customButton : <Plus className="h-4 w-4" />}
    </button>
  );
});
