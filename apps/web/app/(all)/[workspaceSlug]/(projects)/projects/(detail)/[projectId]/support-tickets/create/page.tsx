"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Breadcrumbs, Header } from "@plane/ui";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { PageHead } from "@/components/core/page-title";
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";
import { ReporterDropdown } from "@/components/dropdowns/reporter/dropdown";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { useSupportTicket } from "@/hooks/store/use-support-ticket";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";

export default observer(function CreateSupportTicketPage() {
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentProjectDetails, loader } = useProject();
  const { createTicket } = useSupportTicket();
  const { projectStates } = useProjectState();
  const { data: currentUser } = useUser();
  const {
    project: { projectMemberIds },
    getUserDetails,
  } = useMember();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "none",
    state_id: "",
    assignee_ids: [] as string[],
    reporter_id: currentUser?.id || "",
    reporter_email: "",
    start_date: "",
    due_date: "",
  });

  const wSlug = workspaceSlug?.toString() || "";
  const pId = projectId?.toString() || "";

  const handleCancel = () => {
    router.push(`/${wSlug}/projects/${pId}/support-tickets`);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: "Title is required." });
      return;
    }
    if (!formData.description.trim()) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: "Description is required." });
      return;
    }
    if (!formData.priority || formData.priority === "none") {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: "Priority is required." });
      return;
    }
    if (!formData.state_id) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: "State is required." });
      return;
    }
    if (formData.start_date && formData.due_date) {
      const start = new Date(formData.start_date);
      const due = new Date(formData.due_date);
      if (due < start) {
        setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: "Due Date cannot be before Start Date." });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const ticket = await createTicket(wSlug, pId, {
        title: formData.title,
        description_html: `<p>${formData.description}</p>`,
        priority: formData.priority,
        state_id: formData.state_id,
        assignee_ids: formData.assignee_ids,
        start_date: formData.start_date || undefined,
        due_date: formData.due_date || undefined,
        reporter_user_id: formData.reporter_id || undefined,
        reporter_email: formData.reporter_email || undefined,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Support ticket created successfully",
      });
      // Redirect to the issue detail page since tickets open in the peek overview for issues.
      router.push(`/${wSlug}/projects/${pId}/issues/${ticket.issue_id}`);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to create ticket",
      });
      setIsSubmitting(false);
    }
  };

  // Filter out triage and backlog states
  const availableStates = (projectStates || []).filter(
    (state) => state.name.toLowerCase() !== "backlog" && state.group !== "backlog"
  );

  return (
    <>
      <PageHead title="Create Support Ticket" />
      <Header>
        <Header.LeftItem>
          <Breadcrumbs onBack={handleCancel} isLoading={loader === "init-loader"}>
            <CommonProjectBreadcrumbs workspaceSlug={wSlug} projectId={pId} />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Support Tickets"
                  href={`/${wSlug}/projects/${pId}/support-tickets`}
                />
              }
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Create"
                  href={`/${wSlug}/projects/${pId}/support-tickets/create`}
                  isLast
                />
              }
              isLast
            />
          </Breadcrumbs>
        </Header.LeftItem>
      </Header>

      <div className="h-full w-full overflow-y-auto bg-surface-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Create Support Ticket</h1>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column (Main Form) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="rounded-xl border border-subtle bg-layer-1 p-6 shadow-sm">
                <label className="mb-2 block text-sm font-medium text-secondary">Title *</label>
                <input
                  type="text"
                  placeholder="Enter ticket title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-subtle bg-transparent px-4 py-2.5 text-primary transition-colors focus:border-primary focus:outline-none placeholder:text-placeholder"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="rounded-xl border border-subtle bg-layer-1 p-6 shadow-sm">
                <label className="mb-2 block text-sm font-medium text-secondary">Description *</label>
                <textarea
                  placeholder="Enter ticket description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={8}
                  className="w-full resize-y rounded-lg border border-subtle bg-transparent px-4 py-2.5 text-primary transition-colors focus:border-primary focus:outline-none placeholder:text-placeholder"
                />
              </div>
            </div>

            {/* Right Sidebar (Metadata) */}
            <div className="space-y-6">
              <div className="rounded-xl border border-subtle bg-layer-1 p-6 shadow-sm space-y-5">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 border-b border-subtle pb-2">
                  Properties
                </h3>

                {/* Priority */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary">Priority *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-lg border border-subtle bg-surface-1 px-3 py-2 text-primary transition-colors focus:border-primary focus:outline-none"
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
                  <label className="mb-1.5 block text-sm font-medium text-secondary">State *</label>
                  <select
                    value={formData.state_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, state_id: e.target.value }))}
                    className="w-full rounded-lg border border-subtle bg-surface-1 px-3 py-2 text-primary transition-colors focus:border-primary focus:outline-none"
                  >
                    <option value="">Select a state</option>
                    {availableStates.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tech (Assignee) */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary">Tech (Assignee)</label>
                  <select
                    value={formData.assignee_ids[0] || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        assignee_ids: e.target.value ? [e.target.value] : [],
                      }))
                    }
                    className="w-full rounded-lg border border-subtle bg-surface-1 px-3 py-2 text-primary transition-colors focus:border-primary focus:outline-none"
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

                {/* Reporter */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary">Reporter</label>
                  <div className="h-10 w-full rounded-lg border border-subtle bg-surface-1 text-primary transition-colors focus-within:border-primary">
                    <ReporterDropdown
                      value={formData.reporter_email || formData.reporter_id || null}
                      onChange={(val) => {
                        if (val && val.includes("@")) {
                          setFormData((prev) => ({ ...prev, reporter_email: val, reporter_id: "" }));
                        } else {
                          setFormData((prev) => ({ ...prev, reporter_id: val || "", reporter_email: "" }));
                        }
                      }}
                      projectId={pId}
                      placeholder="Add reporter"
                      buttonVariant="transparent-with-text"
                      className="group w-full h-full flex items-center px-3"
                      buttonContainerClassName="w-full text-left h-full"
                      buttonClassName={`text-body-sm justify-between w-full h-full ${(formData.reporter_id || formData.reporter_email) ? "" : "text-placeholder"}`}
                      hideIcon={!formData.reporter_id && !formData.reporter_email}
                      dropdownArrow
                      dropdownArrowClassName="h-4 w-4"
                    />
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                    className="w-full rounded-lg border border-subtle bg-surface-1 px-3 py-2 text-primary transition-colors focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
                    className="w-full rounded-lg border border-subtle bg-surface-1 px-3 py-2 text-primary transition-colors focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-8 flex items-center justify-end gap-4 border-t border-subtle pt-6 pb-12">
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title.trim()}
              loading={isSubmitting}
            >
              Create Ticket
            </Button>
          </div>
        </div>
      </div>
    </>
  );
});
