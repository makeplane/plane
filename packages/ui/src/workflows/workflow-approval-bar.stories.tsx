/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { WorkflowApprovalBarProps } from "./workflow-approval-bar";
import { WorkflowApprovalBar } from "./workflow-approval-bar";

const meta: Meta<typeof WorkflowApprovalBar> = {
  title: "UI/Workflows/WorkflowApprovalBar",
  component: WorkflowApprovalBar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof WorkflowApprovalBar>;

const labels: WorkflowApprovalBarProps["labels"] = {
  pending: "Approval pending",
  waitingFor: "Waiting for approval",
  approvers: "Approvers",
  addComment: "Add a comment (optional)",
  commentPlaceholder: "Why are you approving or rejecting?",
  approve: "Approve",
  reject: "Reject",
  approveTo: (stateName) => `Approve → ${stateName}`,
  rejectTo: (stateName) => `Reject → ${stateName}`,
};

const Wrapper = (args: WorkflowApprovalBarProps) => {
  const [comment, setComment] = useState("");
  return <WorkflowApprovalBar {...args} comment={comment} onCommentChange={setComment} />;
};

export const EligibleApprover: Story = {
  render: (args) => <Wrapper {...args} />,
  args: {
    sourceStateName: "Submitted",
    targetStateName: "Manager Approval",
    rejectStateName: "Rejected",
    approverNames: ["Nguyễn B"],
    canDecide: true,
    isDeciding: false,
    onApprove: () => undefined,
    onReject: () => undefined,
    labels,
  },
};

export const Deciding: Story = {
  render: (args) => <Wrapper {...args} />,
  args: {
    ...EligibleApprover.args,
    isDeciding: true,
    comment: "Looks good to me.",
  },
};

export const WatchingApprover: Story = {
  render: (args) => <Wrapper {...args} />,
  args: {
    ...EligibleApprover.args,
    // §23.3 — a non-approver sees that an approval is pending, without the
    // approver membership behind it.
    approverNames: [],
    canDecide: false,
  },
};

export const ApprovalWithoutRejectState: Story = {
  render: (args) => <Wrapper {...args} />,
  args: {
    ...EligibleApprover.args,
    rejectStateName: null,
  },
};
