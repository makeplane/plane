/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import { CheckboxField } from "@makeplane/propel/components/checkbox-field";
import {
  DialogActions,
  DialogBody,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { InputField } from "@makeplane/propel/components/input-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { EUserPermissions } from "@plane/constants";
import { setToast } from "@plane/blocks/toast";
import type { TOpsTeam, TOpsTeamPayload, TOpsTeamRole } from "@plane/types";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { getErrorMessage } from "./error-message";

type Props = {
  /** The team being edited, or `null` to create one. */
  team: TOpsTeam | null;
  onSubmit: (payload: TOpsTeamPayload & { name: string }) => Promise<unknown>;
  onClose: () => void;
};

/** Name, description and members of a team. Each member is either a member or a lead. */
export const TeamForm = observer(function TeamForm({ team, onSubmit, onClose }: Props) {
  // states
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [roles, setRoles] = useState<Record<string, TOpsTeamRole>>(() =>
    Object.fromEntries((team?.members ?? []).map((member) => [member.user, member.role]))
  );
  const [isSaving, setIsSaving] = useState(false);
  // hooks
  const { getUserDetails, workspace } = useMember();

  // Guests have no work calendar, so they cannot join a team.
  const candidateIds = (workspace.workspaceMemberIds ?? []).filter(
    (userId) => workspace.getWorkspaceMemberDetails(userId)?.role !== EUserPermissions.GUEST
  );

  const toggleMember = (userId: string, checked: boolean) =>
    setRoles((current) => {
      const next = { ...current };
      if (checked) next[userId] = "MEMBER";
      else delete next[userId];
      return next;
    });

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        members: Object.entries(roles).map(([user, role]) => ({ user, role })),
      });
      onClose();
    } catch (error) {
      setToast({ type: "error", title: "Could not save the team", message: getErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DialogMain>
        <DialogHeader>
          <DialogHeading>
            <DialogTitle>{team ? "Edit team" : "New team"}</DialogTitle>
          </DialogHeading>
        </DialogHeader>
        <DialogBody tabIndex={0}>
          <div className="space-y-3">
            <InputField
              type="text"
              size="lg"
              orientation="vertical"
              label="Name"
              maxLength={255}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <TextAreaField
              size="lg"
              resize="none"
              autoResize
              maxRows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description (optional)"
              aria-label="Description"
              maxLength={2000}
            />
            <fieldset>
              <legend className="mb-1 text-body-xs-medium text-secondary">Members</legend>
              <ul className="max-h-72 divide-y divide-subtle overflow-y-auto rounded-lg border border-subtle">
                {candidateIds.map((userId) => {
                  const role = roles[userId];
                  const displayName = getUserDetails(userId)?.display_name ?? "Unknown";
                  return (
                    <li key={userId} className="flex items-center justify-between gap-3 px-3 py-1.5">
                      <CheckboxField
                        size="lg"
                        label={displayName}
                        checked={!!role}
                        onCheckedChange={(checked) => toggleMember(userId, checked === true)}
                      />
                      {role ? (
                        <CheckboxField
                          size="lg"
                          label="Team lead"
                          checked={role === "LEAD"}
                          onCheckedChange={(checked) =>
                            setRoles((current) => ({ ...current, [userId]: checked === true ? "LEAD" : "MEMBER" }))
                          }
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          </div>
        </DialogBody>
      </DialogMain>
      <DialogActions>
        <Button variant="secondary" size="sm" stretch="auto" label="Cancel" onClick={onClose} />
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          label="Save team"
          loading={isSaving}
          disabled={!name.trim()}
          onClick={handleSubmit}
        />
      </DialogActions>
    </div>
  );
});
