/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Meta, StoryObj } from "@storybook/react";
import type { TWorkflowFlowNode, TWorkflowStateNode } from "./workflow-state-list";
import { WorkflowStateList } from "./workflow-state-list";

const meta: Meta<typeof WorkflowStateList> = {
  title: "UI/Workflows/WorkflowStateList",
  component: WorkflowStateList,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof WorkflowStateList>;

const labels = {
  allowNewWorkItems: "Allow new work items",
  by: "By",
  transition: "Transition",
  approval: "Approval",
  enabled: "Enabled",
  disabled: "Disabled",
  noActors: "No actors configured",
  noActorsTooltip: "An active transition with no actors cannot be performed and returns an error at runtime.",
};

const states: TWorkflowStateNode[] = [
  { id: "ws-1", state_id: "s-1", name: "Submitted", group: "backlog", allow_new_work_items: true },
  { id: "ws-2", state_id: "s-2", name: "Manager Approval", group: "started", allow_new_work_items: false },
  { id: "ws-3", state_id: "s-3", name: "HR Approval", group: "started", allow_new_work_items: false },
  { id: "ws-4", state_id: "s-4", name: "Rejected", group: "cancelled", allow_new_work_items: false },
];

const flowsBySourceStateId: Record<string, TWorkflowFlowNode[]> = {
  "s-1": [
    {
      id: "f-1",
      flow_type: "transition",
      target_state_name: "Manager Approval",
      is_active: true,
      actors: ["All project members"],
    },
  ],
  "s-2": [
    {
      id: "f-2",
      flow_type: "approval",
      target_state_name: "HR Approval",
      reject_state_id: "s-4",
      is_active: true,
      actors: ["Requester's manager"],
    },
  ],
  "s-3": [
    {
      id: "f-3",
      flow_type: "transition",
      target_state_name: "Submitted",
      is_active: true,
      actors: [],
    },
  ],
};

export const Default: Story = {
  args: {
    states,
    flowsBySourceStateId,
    labels,
    className: "w-[420px]",
  },
};

export const ReadOnly: Story = {
  args: {
    states,
    flowsBySourceStateId,
    labels,
    isEditable: false,
    className: "w-[420px]",
  },
};
