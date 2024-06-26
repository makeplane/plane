import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { CircleDot, CopyPlus, Plus, XCircle } from "lucide-react";
import { ISearchIssueResponse, TIssueRelationTypes } from "@plane/types";
import { CustomMenu, RelatedIcon, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ExistingIssuesListModal } from "@/components/core";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
};

export const RelationActionButton: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, customButton, issueId, disabled = false } = props;
  // state
  const [relationKey, setRelationKey] = useState<TIssueRelationTypes | null>(null);
  const { createRelation, isRelationModalOpen, toggleRelationModal } = useIssueDetail();

  // handlers
  const handleOnClick = (relationKey: TIssueRelationTypes) => {
    setRelationKey(relationKey);
    toggleRelationModal(issueId, relationKey);
  };

  // submit handler
  const onSubmit = async (data: ISearchIssueResponse[]) => {
    if (!relationKey) return;
    if (data.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one issue.",
      });
      return;
    }

    await createRelation(
      workspaceSlug,
      projectId,
      issueId,
      relationKey,
      data.map((i) => i.id)
    );

    toggleRelationModal(null, null);
  };

  const handleOnClose = () => {
    setRelationKey(null);
    toggleRelationModal(null, null);
  };

  // options
  const optionItems = [
    {
      key: "blocked_by",
      label: "Blocked by",
      icon: <CircleDot className="h-3 w-3" />,
    },
    {
      key: "blocking",
      label: "Blocking",
      icon: <XCircle className="h-3 w-3" />,
    },
    {
      key: "relates_to",
      label: "Relates to",
      icon: <RelatedIcon className="h-3 w-3" />,
    },
    {
      key: "duplicate",
      label: "Duplicate of",
      icon: <CopyPlus className="h-3 w-3" />,
    },
  ];

  // button element
  const customButtonElement = customButton ? <>{customButton}</> : <Plus className="h-4 w-4" />;

  return (
    <>
      <CustomMenu customButton={customButtonElement} placement="bottom-start" disabled={disabled} closeOnSelect>
        {optionItems.map((item, index) => (
          <CustomMenu.MenuItem
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOnClick(item.key as TIssueRelationTypes);
            }}
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <span>{item.label}</span>
            </div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>

      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isRelationModalOpen?.issueId === issueId && isRelationModalOpen?.relationType === relationKey}
        handleClose={handleOnClose}
        searchParams={{ issue_relation: true, issue_id: issueId }}
        handleOnSubmit={onSubmit}
        workspaceLevelToggle
      />
    </>
  );
});
