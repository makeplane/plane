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
// plane imports
import { MilestoneIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
// dropdown
import { MilestonesDropdown } from "./dropdown";

type TWorkItemSideBarMilestoneItemProps = {
  projectId: string;
  milestoneId: string | undefined;
  updateWorkItemMilestone: (milestoneId: string | undefined) => Promise<void> | undefined;
  disabled?: boolean;
};

export const WorkItemSideBarMilestoneItem = observer(function WorkItemSideBarMilestoneItem(
  props: TWorkItemSideBarMilestoneItemProps
) {
  const { projectId, milestoneId, updateWorkItemMilestone, disabled = false } = props;

  // handlers
  const handleChange = async (milestoneId: string | undefined) => {
    await updateWorkItemMilestone(milestoneId)?.catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to update work item milestone. Please try again.",
      });
    });
  };

  return (
    <SidebarPropertyListItem icon={MilestoneIcon} label="Milestone">
      <MilestonesDropdown
        projectId={projectId}
        value={milestoneId}
        onChange={(milestoneId) => void handleChange(milestoneId)}
        buttonClassName="h-7.5 px-2"
        disabled={disabled}
      />
    </SidebarPropertyListItem>
  );
});
