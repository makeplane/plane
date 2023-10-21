import { FC } from "react";

// react-hook-form
import { Control, Controller, UseFormWatch } from "react-hook-form";
// hooks
import useProjects from "hooks/use-projects";
// components
import { SelectRepository, TFormValues, TIntegrationSteps } from "components/integration";
// ui
import { Button, ToggleSwitch } from "@plane/ui";
import { CustomSearchSelect } from "components/ui";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import { IWorkspaceIntegration } from "types";

type Props = {
  handleStepChange: (value: TIntegrationSteps) => void;
  integration: IWorkspaceIntegration | false | undefined;
  control: Control<TFormValues, any>;
  watch: UseFormWatch<TFormValues>;
};

export const GithubImportData: FC<Props> = ({ handleStepChange, integration, control, watch }) => {
  const { projects } = useProjects();

  const options = projects
    ? projects.map((project) => ({
        value: project.id,
        query: project.name,
        content: <p>{truncateText(project.name, 25)}</p>,
      }))
    : undefined;

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
            {projects && (
              <Controller
                control={control}
                name="project"
                render={({ field: { value, onChange } }) => (
                  <CustomSearchSelect
                    value={value}
                    label={
                      value ? (
                        projects.find((p) => p.id === value)?.name
                      ) : (
                        <span className="text-custom-text-200">Select Project</span>
                      )
                    }
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
};
