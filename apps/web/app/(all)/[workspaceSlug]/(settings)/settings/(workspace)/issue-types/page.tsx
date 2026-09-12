/**
 * Questimus fork change (migration-karol.md §7.12): central issue-type
 * management — workspace-level types apply to every project. List, rename,
 * recolor, add and delete (deletion blocked while issues use the type).
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
// components
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// services
import { IssueService } from "@/services/issue/issue.service";
// local imports
import type { Route } from "./+types/page";
import { IssueTypesWorkspaceSettingsHeader } from "./header";

const service = new IssueService();

type TTypeRow = { id: string; name: string; description: string; color: string; is_default: boolean };

const WorkspaceIssueTypesSettingsPage = observer(function WorkspaceIssueTypesSettingsPage({
  params,
}: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();
  // states
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3f76ff");
  const [editing, setEditing] = useState<Record<string, { name: string; color: string; description: string }>>({});
  // data
  const { data: types, mutate } = useSWR(
    workspaceSlug ? `WORKSPACE_ISSUE_TYPES_${workspaceSlug}` : null,
    () => service.getWorkspaceIssueTypes(workspaceSlug)
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await service.createWorkspaceIssueType(workspaceSlug, { name: newName.trim(), color: newColor });
      setNewName("");
      setNewColor("#3f76ff");
      await mutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("toast.success"), message: "Issue type created" });
    } catch (error: any) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: error?.error ?? "Failed to create" });
    }
  };

  const handleSave = async (type: TTypeRow) => {
    const draft = editing[type.id];
    if (!draft) return;
    try {
      await service.updateWorkspaceIssueType(workspaceSlug, type.id, draft);
      setEditing((prev) => {
        const next = { ...prev };
        delete next[type.id];
        return next;
      });
      await mutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("toast.success"), message: "Issue type updated" });
    } catch (error: any) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: error?.error ?? "Failed to update" });
    }
  };

  const handleDelete = async (type: TTypeRow) => {
    try {
      await service.deleteWorkspaceIssueType(workspaceSlug, type.id);
      await mutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("toast.success"), message: "Issue type deleted" });
    } catch (error: any) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: error?.error ?? "Failed to delete" });
    }
  };

  return (
    <SettingsContentWrapper header={<IssueTypesWorkspaceSettingsHeader />}>
      <PageHead title="Issue types" />
      <div className="flex h-full w-full flex-col gap-6 overflow-hidden p-6">
        <div>
          <h2 className="text-xl font-semibold text-primary">Issue types</h2>
          <p className="mt-1 text-sm text-secondary">
            Workspace-level types apply to every project. Plan = hierarchy items (SP/T/ST prefixes carry the stage),
            Ticket = app reports and general tickets, Design = design work.
          </p>
        </div>

        {/* create */}
        <div className="flex items-center gap-2 rounded-sm border-[0.5px] border-subtle bg-surface-1 p-3">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="size-6 cursor-pointer rounded border-[0.5px] border-subtle bg-transparent"
            aria-label="Color"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="New type name"
            className="flex-grow rounded-sm border-[0.5px] border-subtle bg-surface-2 px-2 py-1.5 text-sm text-primary placeholder:text-placeholder focus:outline-none"
          />
          <Button variant="primary" size="sm" onClick={handleCreate} disabled={!newName.trim()}>
            Add type
          </Button>
        </div>

        {/* list */}
        <div className="flex flex-col gap-2 overflow-y-auto">
          {(types ?? []).map((type: TTypeRow) => {
            const draft = editing[type.id];
            return (
              <div
                key={type.id}
                className="flex items-center gap-3 rounded-sm border-[0.5px] border-subtle bg-surface-1 p-3"
              >
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: type.color }} />
                {draft ? (
                  <>
                    <input
                      type="color"
                      value={draft.color}
                      onChange={(e) => setEditing({ ...editing, [type.id]: { ...draft, color: e.target.value } })}
                      className="size-6 cursor-pointer rounded border-[0.5px] border-subtle bg-transparent"
                      aria-label="Color"
                    />
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setEditing({ ...editing, [type.id]: { ...draft, name: e.target.value } })}
                      className="w-48 rounded-sm border-[0.5px] border-subtle bg-surface-2 px-2 py-1 text-sm text-primary focus:outline-none"
                    />
                    <input
                      type="text"
                      value={draft.description}
                      onChange={(e) => setEditing({ ...editing, [type.id]: { ...draft, description: e.target.value } })}
                      placeholder="Description"
                      className="flex-grow rounded-sm border-[0.5px] border-subtle bg-surface-2 px-2 py-1 text-sm text-primary placeholder:text-placeholder focus:outline-none"
                    />
                    <Button variant="primary" size="sm" onClick={() => handleSave(type)}>
                      Save
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setEditing((prev) => {
                          const next = { ...prev };
                          delete next[type.id];
                          return next;
                        })
                      }
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="w-48 truncate text-sm font-medium text-primary">{type.name}</span>
                    <span className="flex-grow truncate text-sm text-secondary">{type.description}</span>
                    {type.is_default && (
                      <span className="rounded-full bg-layer-transparent-active px-2 py-0.5 text-xs font-medium text-primary">
                        Default
                      </span>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setEditing({ ...editing, [type.id]: { name: type.name, color: type.color, description: type.description } })
                      }
                    >
                      Edit
                    </Button>
                    <Button variant="error-fill" size="sm" onClick={() => handleDelete(type)}>
                      Delete
                    </Button>
                  </>
                )}
              </div>
            );
          })}
          {!types && <p className="text-sm text-secondary">Loading…</p>}
        </div>
      </div>
    </SettingsContentWrapper>
  );
});

export default WorkspaceIssueTypesSettingsPage;
