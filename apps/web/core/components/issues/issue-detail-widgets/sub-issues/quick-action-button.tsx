"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { LayersIcon, Plus } from "lucide-react";
// plane imports
import { WORK_ITEM_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssue, TIssueServiceType } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useIssueDetail } from "@/hooks/store";

type Props = {
  issueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const SubIssuesActionButton: FC<Props> = observer((props) => {
  const { issueId, customButton, disabled = false, issueServiceType } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    issue: { getIssueById },
    toggleCreateIssueModal,
    toggleSubIssuesModal,
    setIssueCrudOperationState,
    issueCrudOperationState,
  } = useIssueDetail(issueServiceType);

  // derived values
  const issue = getIssueById(issueId);

  if (!issue) return <></>;

  // handlers
  const handleIssueCrudState = (
    key: "create" | "existing",
    _parentIssueId: string | null,
    issue: TIssue | null = null
  ) => {
    setIssueCrudOperationState({
      ...issueCrudOperationState,
      [key]: {
        toggle: !issueCrudOperationState[key].toggle,
        parentIssueId: _parentIssueId,
        issue: issue,
      },
    });
  };

  const handleCreateNew = () => {
    captureClick({ elementName: WORK_ITEM_TRACKER_EVENTS.sub_issue.create });
    handleIssueCrudState("create", issueId, null);
    toggleCreateIssueModal(true);
  };

  const handleAddExisting = () => {
    captureClick({ elementName: WORK_ITEM_TRACKER_EVENTS.sub_issue.add_existing });
    handleIssueCrudState("existing", issueId, null);
    toggleSubIssuesModal(issue.id);
  };

  // options
  const optionItems = [
    {
      i18n_label: "common.create_new",
      icon: <Plus className="h-3 w-3" />,
      onClick: handleCreateNew,
    },
    {
      i18n_label: "common.add_existing",
      icon: <LayersIcon className="h-3 w-3" />,
      onClick: handleAddExisting,
    },
  ];

  // button element
  const customButtonElement = customButton ? <>{customButton}</> : <Plus className="h-4 w-4" />;

  return (
    <CustomMenu customButton={customButtonElement} placement="bottom-start" disabled={disabled} closeOnSelect>
      {optionItems.map((item, index) => (
        <CustomMenu.MenuItem
          key={index}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            item.onClick();
          }}
        >
          <div className="flex items-center gap-2">
            {item.icon}
            <span>{t(item.i18n_label)}</span>
          </div>
        </CustomMenu.MenuItem>
      ))}
    </CustomMenu>
  );
});
