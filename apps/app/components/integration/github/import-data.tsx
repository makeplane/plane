import { FC } from "react";

// react-hook-form
import { UseFormSetValue, UseFormWatch } from "react-hook-form";
// hooks
import useProjects from "hooks/use-projects";
// components
import { SelectRepository, TFormValues } from "components/integration";
// ui
import { CustomSearchSelect, PrimaryButton, SecondaryButton } from "components/ui";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import { IWorkspaceIntegrations } from "types";

type Props = {
  handleState: (key: string, valve: any) => void;
  integration: IWorkspaceIntegrations | false | undefined;
  watch: UseFormWatch<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
};

export const GithubImportData: FC<Props> = ({ handleState, integration, watch, setValue }) => {
  const { projects } = useProjects();

  const selectedGithubRepo = watch("github");
  const selectedProject = watch("project");
  const selectedSyncStatus = watch("sync");

  const options =
    projects.map((project) => ({
      value: project.id,
      query: project.name,
      content: <p>{truncateText(project.name, 25)}</p>,
    })) ?? [];

  return (
    <div>
      <h4>Import Data</h4>
      <div className="mt-4 space-y-8">
        <div className="grid grid-cols-12 gap-4 sm:gap-16">
          <div className="col-span-12 sm:col-span-6">
            <h4 className="font-semibold">Select Repository</h4>
            <p className="text-gray-500 text-xs">
              Select the repository that you want the issues to be imported from.
            </p>
          </div>
          <div className="col-span-12 sm:col-span-6">
            {integration && (
              <SelectRepository
                integration={integration}
                value={selectedGithubRepo ? selectedGithubRepo.id : null}
                label={selectedGithubRepo ? `${selectedGithubRepo.full_name}` : "Select Repository"}
                onChange={(repo: any) => setValue("github", repo)}
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 sm:gap-16">
          <div className="col-span-12 sm:col-span-6">
            <h4 className="font-semibold">Select Project</h4>
            <p className="text-gray-500 text-xs">Select the project to import the issues to.</p>
          </div>
          <div className="col-span-12 sm:col-span-6">
            {projects && (
              <CustomSearchSelect
                value={selectedProject}
                label={
                  selectedProject
                    ? projects.find((p) => p.id === selectedProject)?.name
                    : "Select Project"
                }
                onChange={(val: string) => setValue("project", val)}
                options={options}
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 sm:gap-16">
          <div className="col-span-12 sm:col-span-6">
            <h4 className="font-semibold">Sync Issues</h4>
            <p className="text-gray-500 text-xs">Set whether you want to sync the issues or not.</p>
          </div>
          <div className="col-span-12 sm:col-span-6">
            <button
              type="button"
              className={`relative inline-flex h-3.5 w-6 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                selectedSyncStatus ? "bg-green-500" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={selectedSyncStatus}
              onClick={() => setValue("sync", !selectedSyncStatus)}
            >
              <span className="sr-only">Show empty groups</span>
              <span
                aria-hidden="true"
                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  selectedSyncStatus ? "translate-x-2.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <SecondaryButton onClick={() => handleState("state", "import-configure")}>
          Back
        </SecondaryButton>
        <PrimaryButton onClick={() => handleState("state", "migrate-issues")}>Next</PrimaryButton>
      </div>
    </div>
  );
};
