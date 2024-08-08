"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Control, Controller, UseFormWatch } from "react-hook-form";
import { IWorkspaceIntegration } from "@plane/types";
// hooks
// components
import { Button, CustomSearchSelect, ToggleSwitch } from "@plane/ui";
import { SelectRepository, TFormValues, TIntegrationSteps } from "@/components/integration";
// ui
// helpers
import { truncateText } from "@/helpers/string.helper";
import { useProject } from "@/hooks/store";
// types

type Props = {
  handleStepChange: (value: TIntegrationSteps) => void;
  integration: IWorkspaceIntegration | false | undefined;
  control: Control<TFormValues, any>;
  watch: UseFormWatch<TFormValues>;
};

export const GithubImportData: FC<Props> = observer((props) => {
  const { handleStepChange, integration, control, watch } = props;
  // store hooks
  const { workspaceProjectIds, getProjectById } = useProject();

  const options = workspaceProjectIds?.map((projectId) => {
    const projectDetails = getProjectById(projectId);

    return {
      value: `${projectDetails?.id}`,
      query: `${projectDetails?.name}`,
      content: <p>{truncateText(projectDetails?.name ?? "", 25)}</p>,
    };
  });

  return (
    <div className="mt-6">
      <div className="space-y-8">
        <div className="grid grid-cols-12 gap-4 sm:gap-16">
          <div className="col-span-12 sm:col-span-8">
            <h4 className="font-semibold">Select Repository</h4>
            <p className="text-xs text-custom-text-200">
              Select the repository that you want the issues to be imported from.
            </p>
          </div>
          <div className="col-span-12 sm:col-span-4">
            {integration && (
              <Controller
                control={control}
                name="github"
                render={({ field: { value, onChange } }) => (
                  <SelectRepository
                    integration={integration}
                    value={value ? value.id : null}
                    label={
                      value ? `${value.full_name}` : <span className="text-custom-text-200">Select Repository</span>
                    }
                    onChange={onChange}
                    characterLimit={50}
                  />
                )}
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 sm:gap-16">
          <div className="col-span-12 sm:col-span-8">
            <h4 className="font-semibold">Select Project</h4>
            <p className="text-xs text-custom-text-200">Select the project to import the issues to.</p>
          </div>
          <div className="col-span-12 sm:col-span-4">
            {workspaceProjectIds && (
              <Controller
                control={control}
                name="project"
                render={({ field: { value, onChange } }) => (
                  <CustomSearchSelect
                    value={value}
                    label={
                      value ? getProjectById(value)?.name : <span className="text-custom-text-200">Select Project</span>
                    }
                    onChange={onChange}
                    options={options}
                    optionsClassName="w-48"
                  />
                )}
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 sm:gap-16">
          <div className="col-span-12 sm:col-span-8">
            <h4 className="font-semibold">Sync Issues</h4>
            <p className="text-xs text-custom-text-200">Set whether you want to sync the issues or not.</p>
          </div>
          <div className="col-span-12 sm:col-span-4">
            <Controller
              control={control}
              name="sync"
              render={({ field: { value, onChange } }) => (
                <ToggleSwitch value={value} onChange={() => onChange(!value)} />
              )}
            />
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-2">
        <Button variant="neutral-primary" onClick={() => handleStepChange("import-configure")}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={() => handleStepChange("repo-details")}
          disabled={!watch("github") || !watch("project")}
        >
          Next
        </Button>
      </div>
    </div>
  );
});
