import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Button } from "@plane/ui";
import { Plus, Pencil, Trash2, Users, UserPlus, UserMinus } from "lucide-react";
import useSWR from "swr";

import { useChangeManagement } from "@/hooks/store/use-change-management";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { PageHead } from "@/components/core/page-title";
import { SettingsHeading } from "@/components/settings/heading";
import { AssignmentGroupsWorkspaceSettingsHeader } from "./header";
import type { IAssignmentGroup, IAssignmentGroupMember } from "@/services/change-management.service";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { WorkspaceService } from "@/services/workspace.service";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useUserPermissions } from "@/hooks/store/user";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { Avatar, ModalCore } from "@plane/ui";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

const workspaceService = new WorkspaceService();

function AssignmentGroupsPage() {
  const { workspaceSlug: rawSlug } = useParams();
  const workspaceSlug = rawSlug?.toString() ?? "";
  const store = useChangeManagement();
  const { currentWorkspace } = useWorkspace();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();

  const canPerformAdminActions = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.WORKSPACE
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<IAssignmentGroup | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", is_active: true });
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [addingMember, setAddingMember] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");

  // Fetch assignment groups
  useEffect(() => {
    if (workspaceSlug) {
      store.fetchAssignmentGroups(workspaceSlug);
    }
  }, [workspaceSlug]);

  // Fetch workspace members for the "add member" dropdown
  const { data: workspaceMembers = [] } = useSWR(
    canPerformAdminActions && workspaceSlug ? `WORKSPACE_MEMBERS_${workspaceSlug}` : null,
    () => workspaceService.fetchWorkspaceMembers(workspaceSlug),
    { revalidateOnFocus: false }
  );

  if (workspaceUserInfo && !canPerformAdminActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  const handleOpenModal = (group?: IAssignmentGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData({ name: group.name, description: group.description, is_active: group.is_active });
    } else {
      setEditingGroup(null);
      setFormData({ name: "", description: "", is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await store.updateAssignmentGroup(workspaceSlug, editingGroup.id, formData);
      } else {
        await store.createAssignmentGroup(workspaceSlug, formData);
      }
      handleCloseModal();
    } catch (err) {
      console.error("Failed to save assignment group:", err);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (confirm("Are you sure you want to delete this assignment group? This action cannot be undone.")) {
      await store.deleteAssignmentGroup(workspaceSlug, groupId);
    }
  };

  const handleAddMember = async (groupId: string) => {
    if (!selectedMemberId) return;
    try {
      await store.addGroupMember(workspaceSlug, groupId, selectedMemberId);
      setSelectedMemberId("");
      setAddingMember(null);
    } catch (err) {
      console.error("Failed to add member:", err);
    }
  };

  const handleRemoveMember = async (groupId: string, membershipId: string) => {
    try {
      await store.removeGroupMember(workspaceSlug, groupId, membershipId);
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - Assignment Groups`
    : "Assignment Groups";

  return (
    <SettingsContentWrapper header={<AssignmentGroupsWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className="w-full">
        <SettingsHeading
          title="Assignment Groups"
          description="Create and manage assignment groups for the Change Management module. Members in a group can be assigned to changes that reference that group."
          control={
            <Button variant="primary" size="sm" onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Group
            </Button>
          }
        />

        <div className="mt-6 flex flex-col gap-3">
          {store.assignmentGroups?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-custom-border-200 rounded-lg bg-custom-background-90">
              <Users className="h-10 w-10 text-custom-text-300 mb-3" />
              <p className="text-sm font-medium text-custom-text-200">No assignment groups yet</p>
              <p className="text-xs text-custom-text-300 mt-1 max-w-sm">
                Create an assignment group to organize your team members for Change Management workflows.
              </p>
              <Button variant="primary" size="sm" className="mt-4" onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4 mr-1" />
                Create First Group
              </Button>
            </div>
          )}

          {store.assignmentGroups?.map((group) => {
            const isExpanded = expandedGroup === group.id;
            return (
              <div
                key={group.id}
                className="border border-custom-border-200 rounded-lg bg-custom-background-100 overflow-hidden"
              >
                {/* Group header row */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-custom-background-90 transition-colors"
                  onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      group.is_active
                        ? "bg-custom-primary-100/15 text-custom-primary-100"
                        : "bg-custom-background-80 text-custom-text-400"
                    }`}>
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-custom-text-100">{group.name}</h4>
                        {!group.is_active && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                            Inactive
                          </span>
                        )}
                        <span className="text-xs text-custom-text-400">
                          {group.members?.length || 0} member{(group.members?.length || 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-custom-text-300 mt-0.5">
                        {group.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline-primary" size="sm" onClick={() => handleOpenModal(group)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(group.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Members section (expanded) */}
                {isExpanded && (
                  <div className="border-t border-custom-border-200 bg-custom-background-90 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-semibold text-custom-text-200 uppercase tracking-wider">
                        Members
                      </h5>
                      <button
                        onClick={() => setAddingMember(addingMember === group.id ? null : group.id)}
                        className="flex items-center gap-1 text-xs font-medium text-custom-primary-100 hover:text-custom-primary-200 transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Add Member
                      </button>
                    </div>

                    {/* Add member row */}
                    {addingMember === group.id && (
                      <div className="flex items-center gap-2 mb-3 p-2 rounded bg-custom-background-100 border border-custom-border-200">
                        <select
                          className="flex-1 text-sm rounded border border-custom-border-200 bg-custom-background-100 text-custom-text-100 px-2 py-1.5"
                          value={selectedMemberId}
                          onChange={(e) => setSelectedMemberId(e.target.value)}
                        >
                          <option value="">Select a member…</option>
                          {workspaceMembers
                            .filter((m: any) => {
                              const memberId = m.member?.id;
                              return memberId && !group.members?.some((gm) => gm.member === memberId);
                            })
                            .map((m: any) => (
                              <option key={m.member.id} value={m.member.id}>
                                {m.member.display_name || m.member.email}
                              </option>
                            ))}
                        </select>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!selectedMemberId}
                          onClick={() => handleAddMember(group.id)}
                        >
                          Add
                        </Button>
                        <Button
                          variant="neutral-primary"
                          size="sm"
                          onClick={() => { setAddingMember(null); setSelectedMemberId(""); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {/* Member list */}
                    {group.members && group.members.length > 0 ? (
                      <div className="space-y-1">
                        {group.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between px-3 py-2 rounded hover:bg-custom-background-100 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar name={member.member_name || "?"} size={24} />
                              <span className="text-sm text-custom-text-100">
                                {member.member_name || member.member}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveMember(group.id, member.id)}
                              className="text-custom-text-400 hover:text-red-500 transition-colors p-1"
                              title="Remove member"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-custom-text-400 text-center py-4">
                        No members in this group yet. Add workspace members above.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <ModalCore isOpen={isModalOpen} handleClose={handleCloseModal} className="p-6">
        <h3 className="text-lg font-semibold text-custom-text-100 mb-4">
          {editingGroup ? "Edit Assignment Group" : "Create Assignment Group"}
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-custom-text-200 mb-1">Name *</label>
            <input
              type="text"
              required
              className="w-full border border-custom-border-200 rounded-md px-3 py-2 text-sm bg-custom-background-100 text-custom-text-100 focus:border-custom-primary-100 focus:ring-1 focus:ring-custom-primary-100 transition-colors"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Platform Engineering"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-custom-text-200 mb-1">Description</label>
            <textarea
              className="w-full border border-custom-border-200 rounded-md px-3 py-2 text-sm bg-custom-background-100 text-custom-text-100 focus:border-custom-primary-100 focus:ring-1 focus:ring-custom-primary-100 transition-colors resize-y"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of this group's responsibility…"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              className="rounded border-custom-border-200"
              checked={formData.is_active}
              onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
            />
            <label htmlFor="is_active" className="text-sm font-medium text-custom-text-200">
              Active
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-custom-border-200">
            <Button variant="neutral-primary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingGroup ? "Save Changes" : "Create Group"}
            </Button>
          </div>
        </form>
      </ModalCore>
    </SettingsContentWrapper>
  );
}

export default observer(AssignmentGroupsPage);
