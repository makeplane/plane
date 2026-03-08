// [FA-CUSTOM] Step 4: Map file assignees to project members

import { useMemo } from "react";
import { Badge } from "@plane/propel/badge";
import { Button } from "@plane/propel/button";
import { Avatar, CustomSearchSelect } from "@plane/ui";
import type { TProjectMember, TPendingInvite } from "@/services/import.service";
import type { UseImportWizardReturn } from "../hooks/use-import-wizard";

type Props = {
  wizard: UseImportWizardReturn;
};

export function StepAssigneeMapping({ wizard }: Props) {
  const { uploadData, assigneeMapping, setAssigneeMapping } = wizard;
  if (!uploadData) return null;

  const assignees = uploadData.unique_assignees;
  const projectMembers = uploadData.project_members;
  const workspaceMembers = uploadData.workspace_members ?? [];
  const pendingInvites = uploadData.pending_invites ?? [];

  const handleChange = (assigneeValue: string, userId: string) => {
    setAssigneeMapping((prev) => {
      const next = { ...prev };
      if (userId === "") {
        delete next[assigneeValue];
      } else {
        next[assigneeValue] = userId;
      }
      return next;
    });
  };

  // If no assignee column was mapped, skip this step
  if (!assignees?.length) {
    return (
      <div className="space-y-4">
        <p className="text-body-xs-regular text-tertiary">
          No assignee column was detected. Imported issues will be left unassigned.
        </p>
        <div className="flex items-center justify-between border-t border-subtle pt-4">
          <Button variant="tertiary" size="sm" onClick={() => wizard.setStep("status_mapping")}>
            Back
          </Button>
          <Button variant="primary" size="sm" onClick={() => void wizard.saveAndAdvance("review")}>
            Next: Review
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-body-xs-regular text-tertiary">
        Map each assignee name from your file to a project member. Unmapped assignees will be left unassigned.
      </p>

      <div className="overflow-hidden rounded-lg border border-subtle">
        <table className="min-w-full">
          <thead>
            <tr className="bg-layer-3">
              <th className="px-4 py-2 text-left text-caption-md-medium text-secondary">Name in File</th>
              <th className="px-4 py-2 text-left text-caption-md-medium text-secondary">Project Member</th>
            </tr>
          </thead>
          <tbody>
            {assignees.map((assigneeValue) => (
              <tr key={assigneeValue} className="border-t border-subtle">
                <td className="px-4 py-2 text-body-xs-regular text-primary">{assigneeValue}</td>
                <td className="px-4 py-2">
                  <AssigneeSelect
                    value={assigneeMapping[assigneeValue] || ""}
                    onChange={(val: string) => handleChange(assigneeValue, val)}
                    projectMembers={projectMembers}
                    workspaceMembers={workspaceMembers}
                    pendingInvites={pendingInvites}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-subtle pt-4">
        <Button variant="tertiary" size="sm" onClick={() => wizard.setStep("status_mapping")}>
          Back
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={wizard.isLoading}
          loading={wizard.isLoading}
          onClick={() => void wizard.saveAndAdvance("review")}
        >
          Next: Review
        </Button>
      </div>
    </div>
  );
}

function AssigneeSelect({
  value,
  onChange,
  projectMembers,
  workspaceMembers,
  pendingInvites,
}: {
  value: string;
  onChange: (val: string) => void;
  projectMembers: TProjectMember[];
  workspaceMembers: TProjectMember[];
  pendingInvites: TPendingInvite[];
}) {
  const options = useMemo(
    () => [
      { value: "", query: "none بدون مسئول", content: <span className="text-tertiary">— بدون مسئول —</span> },
      ...projectMembers.map((m) => ({
        value: m.member__id,
        query: `${m.member__display_name} ${m.member__email}`,
        content: (
          <div className="flex items-center gap-2">
            <Avatar name={m.member__display_name} size="sm" showTooltip={false} />
            <span className="text-primary">{m.member__display_name}</span>
            <span className="text-caption-md-regular text-tertiary">{m.member__email}</span>
          </div>
        ),
      })),
      ...workspaceMembers.map((m) => ({
        value: m.member__id,
        query: `${m.member__display_name} ${m.member__email}`,
        content: (
          <div className="flex items-center gap-2">
            <Avatar name={m.member__display_name} size="sm" showTooltip={false} />
            <span className="text-primary">{m.member__display_name}</span>
            <Badge variant="brand" size="sm">
              ورک‌اسپیس
            </Badge>
          </div>
        ),
      })),
      ...pendingInvites.map((invite) => ({
        value: `invite:${invite.email}`,
        query: invite.email,
        content: (
          <div className="flex items-center gap-2">
            <Avatar name={invite.email} size="sm" showTooltip={false} />
            <span className="text-primary">{invite.email}</span>
            <Badge variant="warning" size="sm">
              در انتظار
            </Badge>
          </div>
        ),
      })),
    ],
    [projectMembers, workspaceMembers, pendingInvites]
  );

  const noAssigneeLabel = <span className="text-tertiary">— بدون مسئول —</span>;

  const getSelectedLabel = () => {
    if (!value) return noAssigneeLabel;

    if (value.startsWith("invite:")) {
      const email = value.slice("invite:".length);
      return (
        <div className="flex items-center gap-2">
          <Avatar name={email} size="sm" showTooltip={false} />
          <span className="text-primary">{email}</span>
        </div>
      );
    }

    const allMembers = [...projectMembers, ...workspaceMembers];
    const member = allMembers.find((m) => m.member__id === value);
    if (!member) return noAssigneeLabel;
    return (
      <div className="flex items-center gap-2">
        <Avatar name={member.member__display_name} size="sm" showTooltip={false} />
        <span className="text-primary">{member.member__display_name}</span>
      </div>
    );
  };

  return (
    <CustomSearchSelect
      value={value}
      onChange={onChange}
      label={getSelectedLabel()}
      options={options}
      input
      maxHeight="lg"
      buttonClassName="w-full"
    />
  );
}
