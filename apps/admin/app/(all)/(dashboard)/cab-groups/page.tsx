"use client";

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Plus, Trash2, UserPlus, ChevronDown, ChevronUp, Shield, Star } from "lucide-react";
import { API_BASE_URL } from "@plane/constants";
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

interface ICabGroup {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_designated: boolean;
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

const CabGroupsPage = observer(function CabGroupsPage(_props: Route.ComponentProps) {
  // State
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [groups, setGroups] = useState<ICabGroup[]>([]);
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
        apiFetch(`/workspaces/${slug}/cab-groups/`),
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
      await apiFetch(`/workspaces/${selectedSlug}/cab-groups/`, {
        method: "POST",
        body: JSON.stringify({ name: newGroupName, description: newGroupDesc }),
      });
      setNewGroupName("");
      setNewGroupDesc("");
      setShowCreateForm(false);
      setSuccessMsg("CAB group created successfully.");
      fetchGroups(selectedSlug);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Delete this CAB group?")) return;
    try {
      await apiFetch(`/workspaces/${selectedSlug}/cab-groups/${groupId}/`, { method: "DELETE" });
      setSuccessMsg("CAB group deleted.");
      fetchGroups(selectedSlug);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Designate as workspace CAB group
  const handleDesignate = async (groupId: string) => {
    try {
      await apiFetch(`/workspaces/${selectedSlug}/cab-groups/${groupId}/designate/`, { method: "POST" });
      setSuccessMsg("CAB group designated as workspace default.");
      fetchGroups(selectedSlug);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Add member to group
  const handleAddMember = async (groupId: string, memberId: string) => {
    try {
      await apiFetch(`/workspaces/${selectedSlug}/cab-groups/${groupId}/members/`, {
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
      await apiFetch(`/workspaces/${selectedSlug}/cab-groups/${groupId}/members/${membershipId}/`, { method: "DELETE" });
      fetchGroups(selectedSlug);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <PageWrapper
      header={{
        title: "CAB Groups",
        description: "Manage Change Advisory Board groups. The designated group is used during the Authorize stage of Normal changes.",
      }}
    >
      <div className="space-y-6">
        {/* Workspace selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-custom-text-200">Workspace:</label>
          <select
            className="rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 min-w-[240px]"
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
          >
            <option value="">-- Select Workspace --</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.slug}>{w.name} ({w.slug})</option>
            ))}
          </select>
        </div>

        {/* Messages */}
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}
        {successMsg && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">{successMsg}</div>
        )}

        {selectedSlug && !loading && (
          <>
            {/* Create button */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-custom-text-200">
                {groups.length} CAB group{groups.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-1.5 rounded-md bg-custom-primary-100 px-3 py-1.5 text-sm font-medium text-white hover:bg-custom-primary-200 transition-colors"
              >
                <Plus className="h-4 w-4" /> Create CAB Group
              </button>
            </div>

            {/* Create form */}
            {showCreateForm && (
              <div className="rounded-md border border-custom-border-200 bg-custom-background-90 p-4 space-y-3">
                <input
                  className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm"
                  placeholder="CAB group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <input
                  className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm"
                  placeholder="Description (optional)"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateGroup}
                    className="rounded-md bg-custom-primary-100 px-4 py-1.5 text-sm font-medium text-white hover:bg-custom-primary-200"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="rounded-md border border-custom-border-200 px-4 py-1.5 text-sm"
                  >
                    Cancel
                  </button>
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
                  <div
                    key={group.id}
                    className={`rounded-md border bg-custom-background-100 ${
                      group.is_designated ? "border-custom-primary-100 ring-1 ring-custom-primary-100/30" : "border-custom-border-200"
                    }`}
                  >
                    {/* Group header */}
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer"
                      onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-custom-text-300" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{group.name}</span>
                            {group.is_designated && (
                              <span className="flex items-center gap-1 rounded-full bg-custom-primary-100/10 px-2 py-0.5 text-xs text-custom-primary-100 font-medium">
                                <Star className="h-3 w-3" /> Designated
                              </span>
                            )}
                          </div>
                          {group.description && (
                            <p className="text-xs text-custom-text-300">{group.description}</p>
                          )}
                        </div>
                        <span className="rounded-full bg-custom-background-80 px-2 py-0.5 text-xs text-custom-text-300">
                          {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!group.is_designated && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDesignate(group.id); }}
                            className="flex items-center gap-1 rounded-md border border-custom-border-200 px-2 py-1 text-xs hover:bg-custom-background-80 transition-colors"
                            title="Set as workspace CAB group"
                          >
                            <Star className="h-3 w-3" /> Set as Active
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Delete group"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>

                    {/* Expanded: members */}
                    {isExpanded && (
                      <div className="border-t border-custom-border-200 px-4 py-3 space-y-3">
                        {/* Current members */}
                        {group.members.length > 0 ? (
                          <div className="space-y-1">
                            {group.members.map((m) => (
                              <div key={m.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-custom-background-80">
                                <div className="text-sm">
                                  <span className="font-medium">{m.member_name}</span>
                                  <span className="text-custom-text-300 ml-2">({m.member_email})</span>
                                </div>
                                <button
                                  onClick={() => handleRemoveMember(group.id, m.id)}
                                  className="text-xs text-red-500 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-custom-text-300 italic">No members yet.</p>
                        )}

                        {/* Add member */}
                        {availableMembers.length > 0 && (
                          <div className="flex items-center gap-2 pt-2 border-t border-custom-border-100">
                            <UserPlus className="h-4 w-4 text-custom-text-300" />
                            <select
                              className="rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-1.5 text-sm flex-1"
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAddMember(group.id, e.target.value);
                                  e.target.value = "";
                                }
                              }}
                            >
                              <option value="">Add a member...</option>
                              {availableMembers.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.display_name || m.email} ({m.email})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {groups.length === 0 && (
                <p className="text-sm text-custom-text-300 text-center py-8">
                  No CAB groups found for this workspace. Create one above.
                </p>
              )}
            </div>
          </>
        )}

        {loading && <p className="text-sm text-custom-text-300">Loading...</p>}
        {!selectedSlug && <p className="text-sm text-custom-text-300">Select a workspace to manage CAB groups.</p>}
      </div>
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "CAB Groups - God Mode" }];

export default CabGroupsPage;
