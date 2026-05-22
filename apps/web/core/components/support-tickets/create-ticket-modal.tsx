/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useSupportTicket } from "@/hooks/store/use-support-ticket";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useMember } from "@/hooks/store/use-member";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
};

export const CreateSupportTicketModal = observer(function CreateSupportTicketModal({
  isOpen,
  onClose,
  workspaceSlug,
  projectId,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description_html: "<p></p>",
    priority: "none",
    state_id: "",
    assignee_ids: [] as string[],
  });

  const { createTicket } = useSupportTicket();
  const { projectStates } = useProjectState();
  const {
    project: { projectMemberIds },
    getUserDetails,
  } = useMember();

  const handleClose = () => {
    setFormData({
      title: "",
      description_html: "<p></p>",
      priority: "none",
      state_id: "",
      assignee_ids: [],
    });
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Title is required",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createTicket(workspaceSlug, projectId, {
        title: formData.title,
        description_html: formData.description_html,
        priority: formData.priority,
        state_id: formData.state_id || undefined,
        assignee_ids: formData.assignee_ids,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Support ticket created successfully",
      });
      handleClose();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to create ticket",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filter out triage states (triage is not a valid state group in TStateGroups, so we just use projectStates)
  const availableStates = projectStates || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-subtle bg-surface-1 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle px-6 py-4">
          <h2 className="text-lg font-semibold text-primary">Create Support Ticket</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-tertiary transition-colors hover:bg-layer-1 hover:text-secondary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary">Title *</label>
            <input
              type="text"
              placeholder="Enter ticket title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-subtle bg-transparent px-3 py-2 text-sm text-primary outline-none transition-colors placeholder:text-placeholder focus:border-primary"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary">Description</label>
            <textarea
              placeholder="Enter ticket description"
              value={formData.description_html === "<p></p>" ? "" : formData.description_html}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description_html: e.target.value ? `<p>${e.target.value}</p>` : "<p></p>",
                }))
              }
              rows={3}
              className="w-full resize-none rounded-lg border border-subtle bg-transparent px-3 py-2 text-sm text-primary outline-none transition-colors placeholder:text-placeholder focus:border-primary"
            />
          </div>

          {/* Priority & State row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full rounded-lg border border-subtle bg-transparent px-3 py-2 text-sm text-primary outline-none transition-colors focus:border-primary"
              >
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* State */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary">State</label>
              <select
                value={formData.state_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, state_id: e.target.value }))}
                className="w-full rounded-lg border border-subtle bg-transparent px-3 py-2 text-sm text-primary outline-none transition-colors focus:border-primary"
              >
                <option value="">Default</option>
                {availableStates.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee (Tech) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary">
              Tech (Assignee)
            </label>
            <select
              value={formData.assignee_ids[0] || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  assignee_ids: e.target.value ? [e.target.value] : [],
                }))
              }
              className="w-full rounded-lg border border-subtle bg-transparent px-3 py-2 text-sm text-primary outline-none transition-colors focus:border-primary"
            >
              <option value="">Unassigned</option>
              {projectMemberIds?.map((memberId) => {
                const member = getUserDetails(memberId);
                return (
                  <option key={memberId} value={memberId}>
                    {member?.display_name || member?.email || memberId}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-subtle px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-subtle px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-layer-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
});
