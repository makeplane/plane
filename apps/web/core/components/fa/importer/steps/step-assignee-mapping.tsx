// [FA-CUSTOM] Step 4: Map file assignees to project members

import { Button } from "@plane/propel/button";
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
  if (!assignees || assignees.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-custom-text-300">
          No assignee column was detected. Imported issues will be left unassigned.
        </p>
        <div className="flex items-center justify-between border-t border-custom-border-200 pt-4">
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
      <p className="text-sm text-custom-text-300">
        Map each assignee name from your file to a project member. Unmapped assignees will be left unassigned.
      </p>

      <div className="overflow-hidden rounded border border-custom-border-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-custom-background-80">
              <th className="px-4 py-2 text-left font-medium text-custom-text-200">Name in File</th>
              <th className="px-4 py-2 text-left font-medium text-custom-text-200">Project Member</th>
            </tr>
          </thead>
          <tbody>
            {assignees.map((assigneeValue) => (
              <tr key={assigneeValue} className="border-t border-custom-border-200">
                <td className="px-4 py-2 text-custom-text-100">{assigneeValue}</td>
                <td className="px-4 py-2">
                  <select
                    value={assigneeMapping[assigneeValue] || ""}
                    onChange={(e) => handleChange(assigneeValue, e.target.value)}
                    className="w-full rounded border border-custom-border-200 bg-custom-background-100 px-3 py-1.5 text-sm text-custom-text-100"
                  >
                    <option value="">— بدون مسئول —</option>
                    <optgroup label="اعضای پروژه">
                      {projectMembers.map((member) => (
                        <option key={member.member__id} value={member.member__id}>
                          {member.member__display_name} ({member.member__email})
                        </option>
                      ))}
                    </optgroup>
                    {workspaceMembers.length > 0 && (
                      <optgroup label="اعضای ورک‌اسپیس (به پروژه اضافه می‌شوند)">
                        {workspaceMembers.map((member) => (
                          <option key={member.member__id} value={member.member__id}>
                            {member.member__display_name} ({member.member__email})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {pendingInvites.length > 0 && (
                      <optgroup label="دعوت‌های در انتظار (قابل انتخاب نیست)">
                        {pendingInvites.map((invite) => (
                          <option key={invite.email} value="" disabled>
                            {invite.email} — در انتظار پذیرش
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-custom-border-200 pt-4">
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
