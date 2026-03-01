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

import { useState } from "react";
import { observer } from "mobx-react";
import { LayersIcon } from "lucide-react";
import { PlusIcon, MilestoneIcon } from "@plane/propel/icons";
import { Card } from "@plane/propel/card";
import { Pill, EPillSize } from "@plane/propel/pill";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { ISearchIssueResponse } from "@plane/types";
import { Button } from "@plane/propel/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleButton } from "@plane/propel/collapsible";
import { CircularProgressIndicator, cn } from "@plane/ui";
import { getMilestoneIconProps, renderFormattedPayloadDate } from "@plane/utils";
import { DateDropdown } from "@/components/dropdowns/date";
import { RichTextEditor } from "@/components/editor/rich-text";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";
import { MilestoneQuickActionButton } from "./helper";
import { MilestoneWorkItemsList } from "./milestone-work-items";
import { MilestoneWorkItemActionButton } from "./quick-action-button";

type Props = {
  milestoneId: string;
  workspaceSlug: string;
  projectId: string;
};

export const MilestoneCard = observer(function MilestoneCard(props: Props) {
  const { milestoneId, workspaceSlug, projectId } = props;
  // state
  const [isLinkedWorkItemsOpen, setIsLinkedWorkItemsOpen] = useState(false);
  // store hooks
  const { updateMilestone, addWorkItemsToMilestone, getMilestoneById } = useMilestones();

  const milestone = getMilestoneById(projectId, milestoneId);

  if (!milestone) return null;

  const handleUpdateDate = async (date: Date) => {
    await updateMilestone(workspaceSlug, projectId, milestoneId, {
      target_date: date ? renderFormattedPayloadDate(date) : null,
    }).catch((error) => {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to update milestone date. Please try again.",
      });
    });
  };

  const handleAddWorkItems = async (data: ISearchIssueResponse[]) => {
    const workItemIds = data.map((item) => item.id).filter((id) => id !== null);
    await addWorkItemsToMilestone(workspaceSlug, projectId, milestoneId, workItemIds).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to add work items to milestone. Please try again.",
      });
    });
  };

  return (
    <Card className="shadow-none p-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center overflow-hidden">
          <div className="size-4">
            <MilestoneIcon {...getMilestoneIconProps(milestone.progress_percentage)} className="size-4" />
          </div>
          <span className="text-body-sm-medium text-primary truncate shrink">{milestone.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <DateDropdown
            value={milestone.target_date}
            isClearable={false}
            onChange={(date) => {
              if (date) {
                handleUpdateDate(date);
              }
            }}
            buttonVariant="border-with-text"
          />
          <MilestoneQuickActionButton workspaceSlug={workspaceSlug} milestoneId={milestoneId} projectId={projectId} />
        </div>
      </div>
      {milestone.description?.description_html ? (
        <RichTextEditor
          editable={false}
          id={milestoneId}
          initialValue={milestone.description?.description_html ?? ""}
          value={milestone.description?.description_html ?? ""}
          workspaceId={milestone.workspace_id ?? ""}
          workspaceSlug={workspaceSlug}
          containerClassName="border-none ring-none outline-none text-body-xs-regular px-0 py-2"
          editorClassName="px-0"
          displayConfig={{
            fontSize: "small-font",
          }}
        />
      ) : (
        <div className="py-1" />
      )}
      {/* Linked Work items collapsible */}
      <div className="border-t border-subtle-1 pt-1">
        {milestone.progress.total_items ? (
          <Collapsible open={isLinkedWorkItemsOpen} onOpenChange={setIsLinkedWorkItemsOpen}>
            <CollapsibleTrigger className="w-full">
              <CollapsibleButton
                isOpen={isLinkedWorkItemsOpen}
                title={"Linked Work items"}
                indicatorElement={
                  <Pill size={EPillSize.SM} className="border-none">
                    <div className="flex items-center gap-1">
                      <CircularProgressIndicator
                        size={16}
                        percentage={milestone.progress_percentage}
                        strokeWidth={3}
                        strokeColor={cn(
                          milestone.progress_percentage >= 100 ? "stroke-success-secondary" : "stroke-accent-primary"
                        )}
                      />
                      <span className="text-caption-sm-medium text-primary">{milestone.progress_percentage}%</span>
                    </div>
                  </Pill>
                }
                actionItemElement={
                  <MilestoneWorkItemActionButton
                    projectId={projectId}
                    workspaceSlug={workspaceSlug}
                    customButton={<PlusIcon className="size-4 text-secondary" />}
                    handleSubmit={handleAddWorkItems}
                  />
                }
                titleClassName="text-body-xs-regular"
                className="border-none h-min px-0"
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <MilestoneWorkItemsList milestoneId={milestoneId} workspaceSlug={workspaceSlug} projectId={projectId} />
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div className="pt-2">
            <MilestoneWorkItemActionButton
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              customButton={
                <Button variant="secondary" className="text-secondary text-caption-sm-medium">
                  <LayersIcon className="size-3" />
                  Link work items
                </Button>
              }
              handleSubmit={handleAddWorkItems}
            />
          </div>
        )}
      </div>
    </Card>
  );
});
