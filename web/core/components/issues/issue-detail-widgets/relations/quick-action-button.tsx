"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { TIssueRelationTypes } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store";
// helper
import { ISSUE_RELATION_OPTIONS } from "./helper";

type Props = {
  issueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
};

export const RelationActionButton: FC<Props> = observer((props) => {
  const { customButton, issueId, disabled = false } = props;
  // store hooks
  const { toggleRelationModal, setRelationKey } = useIssueDetail();

  // handlers
  const handleOnClick = (relationKey: TIssueRelationTypes) => {
    setRelationKey(relationKey);
    toggleRelationModal(issueId, relationKey);
  };

  // button element
  const customButtonElement = customButton ? <>{customButton}</> : <Plus className="h-4 w-4" />;

  return (
    <CustomMenu customButton={customButtonElement} placement="bottom-start" disabled={disabled} closeOnSelect>
      {ISSUE_RELATION_OPTIONS.map((item, index) => (
        <CustomMenu.MenuItem
          key={index}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleOnClick(item.key as TIssueRelationTypes);
          }}
        >
          <div className="flex items-center gap-2">
            {item.icon(12)}
            <span>{item.label}</span>
          </div>
        </CustomMenu.MenuItem>
      ))}
    </CustomMenu>
  );
});
