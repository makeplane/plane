/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { Badge } from "@plane/propel/badge";
import { ApproverIcon, TrashIcon, WorkflowIcon } from "@plane/propel/icons";
import { Menu } from "@plane/propel/menu";
import { Switch } from "@plane/propel/switch";
import { cn } from "@plane/propel/utils";
import type { IWorkflowState } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";

type Props = {
  handleDelete: () => void;
  handleToggle: () => void;
  workflowState: IWorkflowState;
  isDefaultWorkflow: boolean;
};

export const WorkflowStateCardActions = observer(function WorkflowStateCardActions(props: Props) {
  //props
  const { handleDelete, handleToggle, workflowState, isDefaultWorkflow } = props;

  // derived values
  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "delete",
      title: "Delete",
      icon: TrashIcon,
      action: handleDelete,
      className: "text-danger-primary",
      shouldRender: !isDefaultWorkflow,
    },
  ];
  const filteredMenuItems = MENU_ITEMS.filter((item) => item.shouldRender !== false);

  return (
    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 shrink-0 cursor-default">
      {workflowState.transitionIds.length > 0 && (
        <Badge variant="success" prependIcon={workflowState.type === "approval" ? <ApproverIcon /> : <WorkflowIcon />}>
          {workflowState.transitionIds.length}
        </Badge>
      )}
      <div className="flex items-center gap-2">
        <span className="text-caption-md-regular">Allow new work items</span>
        <Switch
          value={workflowState.allow_issue_creation}
          onChange={() => {
            handleToggle();
          }}
        />
      </div>
      {filteredMenuItems.length > 0 && (
        <Menu ellipsis>
          {filteredMenuItems.map((item) => (
            <Menu.MenuItem
              key={item.key}
              className={cn("flex items-center gap-2", item.className)}
              onClick={item.action}
            >
              <div className="flex items-center gap-2">
                {item.icon && <item.icon className="h-3 w-3" />}
                <p className="text-caption-sm-medium">{item.title}</p>
              </div>
            </Menu.MenuItem>
          ))}
        </Menu>
      )}
    </div>
  );
});
