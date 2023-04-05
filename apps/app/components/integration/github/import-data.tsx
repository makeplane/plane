import { FC, useState } from "react";

// react-hook-form
import { Control, Controller, UseFormWatch } from "react-hook-form";
// hooks
import useProjects from "hooks/use-projects";
// components
import { SelectRepository, TFormValues, TIntegrationSteps } from "components/integration";
// ui
import { CustomSearchSelect, PrimaryButton, SecondaryButton } from "components/ui";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import { IWorkspaceIntegrations } from "types";

type Props = {
  handleStepChange: (value: TIntegrationSteps) => void;
  integration: IWorkspaceIntegrations | false | undefined;
  control: Control<TFormValues, any>;
  watch: UseFormWatch<TFormValues>;
};

export const GithubImportData: FC<Props> = ({ handleStepChange, integration, control, watch }) => {
  const { projects } = useProjects();

  const options =
    projects.map((project) => ({
      value: project.id,
      query: project.name,
      content: <p>{truncateText(project.name, 25)}</p>,
    })) ?? [];

  return (
    <div className="mt-6">
      <div className="space-y-8">
        <div className="grid grid-cols-12 gap-4 sm:gap-16">
          <div className="col-span-12 sm:col-span-8">
            <h4 className="font-semibold">Select Repository</h4>
            <p className="text-gray-500 text-xs">
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
                    label={value ? `${value.full_name}` : "Select Repository"}
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
            <p className="text-gray-500 text-xs">Select the project to import the issues to.</p>
          </div>
          <div className="col-span-12 sm:col-span-4">
            {projects && (
              <Controller
                control={control}
                name="project"
                render={({ field: { value, onChange } }) => (
                  <CustomSearchSelect
                    value={value}
                    label={value ? projects.find((p) => p.id === value)?.name : "Select Project"}
                    onChange={onChange}
                    options={options}
                    optionsClassName="w-full"
                  />
                )}
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 sm:gap-16">
          <div className="col-span-12 sm:col-span-8">
            <h4 className="font-semibold">Sync Issues</h4>
            <p className="text-gray-500 text-xs">Set whether you want to sync the issues or not.</p>
          </div>
          <div className="col-span-12 sm:col-span-4">
            <Controller
              control={control}
              name="sync"
              render={({ field: { value, onChange } }) => (
                <button
                  type="button"
                  className={`relative inline-flex h-3.5 w-6 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    value ? "bg-green-500" : "bg-gray-200"
                  }`}
                  role="switch"
                  aria-checked={value ? true : false}
                  onClick={() => onChange(!value)}
                >
                  <span className="sr-only">Show empty groups</span>
                  <span
                    aria-hidden="true"
                    className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      value ? "translate-x-2.5" : "translate-x-0"
                    }`}
                  />
                </button>
              )}
            />
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-2">
        <SecondaryButton onClick={() => handleStepChange("import-configure")}>Back</SecondaryButton>
        <PrimaryButton
          onClick={() => handleStepChange("repo-details")}
          disabled={!watch("github") || !watch("project")}
        >
          Next
        </PrimaryButton>
      </div>
    </div>
  );
};
