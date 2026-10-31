/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import { Dialog, DialogContent } from "@makeplane/propel/components/dialog";
import { Icon } from "@makeplane/propel/components/icon";
import { AddOutline } from "@makeplane/propel/icons";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import type { TOpsTeam } from "@plane/types";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useOpsTeams } from "@/hooks/team-ops/use-work-calendar";
// local imports
import { getErrorMessage } from "./error-message";
import { TeamForm } from "./team-form";

type Props = {
  workspaceSlug: string;
};

/** Teams of the workspace. A team lead can see their team's calendar when the policy allows it. */
export const TeamsSection = observer(function TeamsSection({ workspaceSlug }: Props) {
  // states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<TOpsTeam | null>(null);
  const [toDelete, setToDelete] = useState<TOpsTeam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // hooks
  const { getUserDetails } = useMember();
  const { teams, createTeam, updateTeam, deleteTeam } = useOpsTeams(workspaceSlug);

  const openForm = (team: TOpsTeam | null) => {
    setEditing(team);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      await deleteTeam(toDelete.id);
      setToast({ type: "success", title: "Team deleted", message: "" });
    } catch (error) {
      setToast({ type: "error", title: "Could not delete the team", message: getErrorMessage(error) });
    } finally {
      setIsDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-subtle bg-surface-1 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-h6-medium text-primary">Teams</h2>
          <p className="text-caption-sm-regular text-tertiary">
            Teams filter the team calendar, and their leads can see (and, if the policy allows, plan for) their team.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          stretch="auto"
          icon={<Icon icon={AddOutline} />}
          label="New team"
          onClick={() => openForm(null)}
        />
      </div>

      {teams && teams.length > 0 ? (
        <ul className="divide-y divide-subtle rounded-lg border border-subtle">
          {teams.map((team) => {
            const leads = team.members
              .filter((member) => member.role === "LEAD")
              .map((member) => getUserDetails(member.user)?.display_name ?? "Unknown");
            return (
              <li key={team.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-body-sm-medium text-primary">{team.name}</p>
                  <p className="truncate text-caption-sm-regular text-tertiary">
                    {team.members.length} {team.members.length === 1 ? "member" : "members"}
                    {leads.length > 0 ? ` · Lead: ${leads.join(", ")}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="ghost" size="sm" stretch="auto" label="Edit" onClick={() => openForm(team)} />
                  <Button variant="ghost" size="sm" stretch="auto" label="Delete" onClick={() => setToDelete(team)} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-body-sm-regular text-tertiary">No teams yet.</p>
      )}

      <Dialog open={isFormOpen} disablePointerDismissal onOpenChange={(open) => !open && setIsFormOpen(false)}>
        <DialogContent size="md">
          {/* Remounted per team so the form always starts from that team's values. */}
          <TeamForm
            key={editing?.id ?? "new"}
            team={editing}
            onSubmit={(payload) => (editing ? updateTeam(editing.id, payload) : createTeam(payload))}
            onClose={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!toDelete}
        handleClose={() => setToDelete(null)}
        handleSubmit={handleDelete}
        isSubmitting={isDeleting}
        title="Delete team"
        content={`Delete ${toDelete?.name ?? "this team"}? Its members stay in the workspace; their plans are not changed.`}
      />
    </section>
  );
});
