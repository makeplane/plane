"use client";

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Plus, Trash2, UserPlus, ChevronDown, ChevronUp, Users } from "lucide-react";
import { API_BASE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { CustomSelect, Input } from "@plane/ui";
import { PageWrapper } from "@/components/common/page-wrapper";
import type { Route } from "./+types/page";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

interface IWorkspace {
  id: string;
  name: string;
  slug: string;
}

interface IGroupMember {
  id: string;
  member: string;
  member_email: string;
  member_name: string;
}

interface IAssignmentGroup {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  members: IGroupMember[];
}

interface IWorkspaceMember {
  id: string;
  display_name: string;
  email: string;
  role: number;
}

// -----------------------------------------------------------------------
// API helpers
// -----------------------------------------------------------------------

async function apiFetch(path: string, options: RequestInit = {}) {
  const resp = await fetch(`${API_BASE_URL}/api/instances${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${resp.status}`);
  }
  if (resp.status === 204) return null;
  return resp.json();
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

const AssignmentGroupsPage = observer(function AssignmentGroupsPage(_props: Route.ComponentProps) {
  // State
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [groups, setGroups] = useState<IAssignmentGroup[]>([]);
  const [members, setMembers] = useState<IWorkspaceMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // Create group form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  // Error/success
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch workspaces
  useEffect(() => {
    apiFetch("/workspaces/")
      .then((data) => setWorkspaces(data?.results || []))
      .catch((e) => setError(e.message));
  }, []);

  // Fetch groups + members when workspace selected
  const fetchGroups = useCallback(async (slug: string) => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const [grps, mems] = await Promise.all([
        apiFetch(`/workspaces/${slug}/assignment-groups/`),
        apiFetch(`/workspaces/${slug}/members/`),
      ]);
      setGroups(grps || []);
      setMembers(mems || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSlug) fetchGroups(selectedSlug);
  }, [selectedSlug, fetchGroups]);

  // Create group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setError(null);
    try {
      await apiFetch(`/workspaces/${selectedSlug}/assignment-groups/`, {
        method: "POST",
        body: JSON.stringify({ name: newGroupName, description: newGroupDesc }),
      });
      setNewGroupName("");
      setNewGroupDesc("");
      setShowCreateForm(false);
      setSuccessMsg("Assignment group created successfully.");
      fetchGroups(selectedSlug);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Delete this assignment group?")) return;
    try {
      await apiFetch(`/workspaces/${selectedSlug}/assignment-groups/${groupId}/`, { method: "DELETE" });
      setSuccessMsg("Assignment group deleted.");
      fetchGroups(selectedSlug);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Add member to group
  const handleAddMember = async (groupId: string, memberId: string) => {
    try {
      await apiFetch(`/workspaces/${selectedSlug}/assignment-groups/${groupId}/members/`, {
        method: "POST",
        body: JSON.stringify({ member: memberId }),
      });
      fetchGroups(selectedSlug);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Remove member
  const handleRemoveMember = async (groupId: string, membershipId: string) => {
    try {
      await apiFetch(`/workspaces/${selectedSlug}/assignment-groups/${groupId}/members/${membershipId}/`, { method: "DELETE" });
      fetchGroups(selectedSlug);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <PageWrapper
      header={{
        title: "Assignment Groups",
        description: "Manage assignment groups for change management peer reviews.",
      }}
    >
      <div className="space-y-6">
        {/* Workspace selector */}
        <div className="flex items-center gap-4">
          <label className="text-13 font-medium text-tertiary">Workspace:</label>
          <div className="min-w-[240px]">
            <CustomSelect
              value={selectedSlug}
              onChange={(val: string) => setSelectedSlug(val)}
              label={
                selectedSlug ? (
                  workspaces.find((w) => w.slug === selectedSlug)?.name || selectedSlug
                ) : (
                  <span className="text-placeholder">-- Select Workspace --</span>
                )
              }
              input
            >
              <CustomSelect.Option value="">-- Select Workspace --</CustomSelect.Option>
              {workspaces.map((w) => (
                <CustomSelect.Option key={w.id} value={w.slug}>
                  {w.name} ({w.slug})
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-13 text-red-500">{error}</div>
        )}
        {successMsg && (
          <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3 text-13 text-green-500">{successMsg}</div>
        )}

        {selectedSlug && !loading && (
          <>
            {/* Create button */}
            <div className="flex items-center justify-between">
              <span className="text-14 font-medium text-secondary">
                {groups.length} group{groups.length !== 1 ? "s" : ""}
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
                prependIcon={<Plus className="h-4 w-4" />}
              >
                Create Group
              </Button>
            </div>

            {/* Create form */}
            {showCreateForm && (
              <div className="rounded-md border border-border-200 bg-background-90 p-4 space-y-3">
                <Input
                  id="newGroupName"
                  type="text"
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full"
                />
                <Input
                  id="newGroupDesc"
                  type="text"
                  placeholder="Description (optional)"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={handleCreateGroup}>
                    Save
                  </Button>
                  <Button variant="outline-primary" size="sm" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Groups list */}
            <div className="space-y-3">
              {groups.map((group) => {
                const isExpanded = expandedGroupId === group.id;
                const groupMemberIds = new Set(group.members.map((m) => m.member));
                const availableMembers = members.filter((m) => !groupMemberIds.has(m.id));

                return (
                  <div key={group.id} className="rounded-md border border-border-200 bg-background-100">
                    {/* Group header */}
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer"
                      onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-tertiary" />
                        <div>
                          <span className="font-medium text-14 text-primary">{group.name}</span>
                          {group.description && (
                            <p className="text-12 text-tertiary">{group.description}</p>
                          )}
                        </div>
                        <span className="rounded-full bg-background-80 px-2 py-0.5 text-12 text-tertiary">
                          {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                          className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                          title="Delete group"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-tertiary" /> : <ChevronDown className="h-4 w-4 text-tertiary" />}
                      </div>
                    </div>

                    {/* Expanded: members */}
                    {isExpanded && (
                      <div className="border-t border-border-200 px-4 py-3 space-y-3">
                        {/* Current members */}
                        {group.members.length > 0 ? (
                          <div className="space-y-1">
                            {group.members.map((m) => (
                              <div key={m.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-background-80">
                                <div className="text-14">
                                  <span className="font-medium text-primary">{m.member_name}</span>
                                  <span className="text-tertiary ml-2">({m.member_email})</span>
                                </div>
                                <button
                                  onClick={() => handleRemoveMember(group.id, m.id)}
                                  className="text-12 text-red-500 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-14 text-tertiary italic">No members yet.</p>
                        )}

                        {/* Add member */}
                        {availableMembers.length > 0 && (
                          <div className="flex items-center gap-2 pt-2 border-t border-border-100">
                            <UserPlus className="h-4 w-4 text-tertiary" />
                            <div className="flex-1">
                              <CustomSelect
                                value=""
                                onChange={(val: string) => {
                                  if (val) handleAddMember(group.id, val);
                                }}
                                label={<span className="text-placeholder">Add a member...</span>}
                                input
                              >
                                <CustomSelect.Option value="">Add a member...</CustomSelect.Option>
                                {availableMembers.map((m) => (
                                  <CustomSelect.Option key={m.id} value={m.id}>
                                    {m.display_name || m.email} ({m.email})
                                  </CustomSelect.Option>
                                ))}
                              </CustomSelect>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {groups.length === 0 && (
                <p className="text-14 text-tertiary text-center py-8">
                  No assignment groups found for this workspace. Create one above.
                </p>
              )}
            </div>
          </>
        )}

        {loading && <p className="text-14 text-tertiary">Loading...</p>}
        {!selectedSlug && <p className="text-14 text-tertiary">Select a workspace to manage assignment groups.</p>}
      </div>
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Assignment Groups - God Mode" }];

export default AssignmentGroupsPage;
