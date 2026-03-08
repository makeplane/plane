// [FA-CUSTOM] Step 3: Map file statuses to project states

import { Button } from "@plane/propel/button";
import { CustomSearchSelect } from "@plane/ui";
import type { UseImportWizardReturn } from "../hooks/use-import-wizard";

type Props = {
  wizard: UseImportWizardReturn;
};

export function StepStatusMapping({ wizard }: Props) {
  const { uploadData, statusMapping, setStatusMapping } = wizard;
  if (!uploadData) return null;

  const statuses = uploadData.unique_statuses;
  const projectStates = uploadData.project_states;

  const handleChange = (statusValue: string, stateId: string) => {
    setStatusMapping((prev) => {
      const next = { ...prev };
      if (stateId === "") {
        delete next[statusValue];
      } else {
        next[statusValue] = stateId;
      }
      return next;
    });
  };

  // If no status column was mapped, skip this step
  if (!statuses?.length) {
    return (
      <div className="space-y-4">
        <p className="text-body-xs-regular text-tertiary">
          No status column was detected. All imported issues will use the project&apos;s default status.
        </p>
        <div className="flex items-center justify-between border-t border-subtle pt-4">
          <Button variant="tertiary" size="sm" onClick={() => wizard.setStep("column_mapping")}>
            Back
          </Button>
          <Button variant="primary" size="sm" onClick={() => void wizard.saveAndAdvance("assignee_mapping")}>
            Next: Map Assignees
          </Button>
        </div>
      </div>
    );
  }

  const stateOptions = [
    { value: "", query: "default", content: <span className="text-tertiary">— Default —</span> },
    ...projectStates.map((state) => ({
      value: state.id,
      query: `${state.name} ${state.group}`,
      content: (
        <div className="flex items-center gap-2">
          <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: state.color }} />
          <span className="text-primary">{state.name}</span>
          <span className="text-caption-md-regular text-tertiary">({state.group})</span>
        </div>
      ),
    })),
  ];

  const defaultLabel = <span className="text-tertiary">— Default —</span>;

  const getSelectedLabel = (statusValue: string) => {
    const stateId = statusMapping[statusValue];
    const state = stateId ? projectStates.find((s) => s.id === stateId) : undefined;
    if (!state) return defaultLabel;
    return (
      <div className="flex items-center gap-2">
        <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: state.color }} />
        <span className="text-primary">{state.name}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-body-xs-regular text-tertiary">
        Map each status value from your file to a project state. Unmapped statuses will use the default state.
      </p>

      <div className="overflow-hidden rounded-lg border border-subtle">
        <table className="min-w-full">
          <thead>
            <tr className="bg-layer-3">
              <th className="px-4 py-2 text-left text-caption-md-medium text-secondary">Status in File</th>
              <th className="px-4 py-2 text-left text-caption-md-medium text-secondary">Project State</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((statusValue) => (
              <tr key={statusValue} className="border-t border-subtle">
                <td className="px-4 py-2 text-body-xs-regular text-primary">{statusValue}</td>
                <td className="px-4 py-2">
                  <CustomSearchSelect
                    value={statusMapping[statusValue] || ""}
                    onChange={(val: string) => handleChange(statusValue, val)}
                    label={getSelectedLabel(statusValue)}
                    options={stateOptions}
                    input
                    maxHeight="lg"
                    buttonClassName="w-full"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-subtle pt-4">
        <Button variant="tertiary" size="sm" onClick={() => wizard.setStep("column_mapping")}>
          Back
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={wizard.isLoading}
          loading={wizard.isLoading}
          onClick={() => void wizard.saveAndAdvance("assignee_mapping")}
        >
          Next: Map Assignees
        </Button>
      </div>
    </div>
  );
}
