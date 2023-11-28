import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useFormContext, Controller } from "react-hook-form";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// icons
import { Plus } from "lucide-react";
// components
import { CustomSelect, Input } from "@plane/ui";
// types
import { IJiraImporterForm } from "types";

export const JiraGetImportDetail: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { project: projectStore, commandPalette: commandPaletteStore, trackEvent: { setTrackElement } } = useMobxStore();
  const projects = workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : undefined;

  const {
    control,
    formState: { errors },
  } = useFormContext<IJiraImporterForm>();

  return (
    <div className="h-full w-full space-y-8 overflow-y-auto">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-1">
          <h3 className="font-semibold">Jira Personal Access Token</h3>
          <p className="text-sm text-custom-text-200">
            Get to know your access token by navigating to{" "}
            <Link href="https://id.atlassian.com/manage-profile/security/api-tokens">
              <a className="text-custom-primary underline" target="_blank" rel="noreferrer">
                Atlassian Settings
              </a>
            </Link>
          </p>
        </div>

        <div className="col-span-1">
          <Controller
            control={control}
            name="metadata.api_token"
            rules={{
              required: "Please enter your personal access token.",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="metadata.api_token"
                name="metadata.api_token"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                placeholder="XXXXXXXX"
                className="w-full"
                autoComplete="off"
              />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-1">
          <h3 className="font-semibold">Jira Project Key</h3>
          <p className="text-sm text-custom-text-200">If XXX-123 is your issue, then enter XXX</p>
        </div>
        <div className="col-span-1">
          <Controller
            control={control}
            name="metadata.project_key"
            rules={{
              required: "Please enter your project key.",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="metadata.project_key"
                name="metadata.project_key"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.metadata?.project_key)}
                placeholder="LIN"
                className="w-full"
              />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-1">
          <h3 className="font-semibold">Jira Email Address</h3>
          <p className="text-sm text-custom-text-200">Enter the Email account that you use in Jira account</p>
        </div>
        <div className="col-span-1">
          <Controller
            control={control}
            name="metadata.email"
            rules={{
              required: "Please enter email address.",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="metadata.email"
                name="metadata.email"
                type="email"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.metadata?.email)}
                placeholder="name@company.com"
                className="w-full"
              />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-1">
          <h3 className="font-semibold">Jira Installation or Cloud Host Name</h3>
          <p className="text-sm text-custom-text-200">Enter your companies cloud host name</p>
        </div>
        <div className="col-span-1">
          <Controller
            control={control}
            name="metadata.cloud_hostname"
            rules={{
              required: "Please enter your cloud host name.",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="metadata.cloud_hostname"
                name="metadata.cloud_hostname"
                type="email"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.metadata?.cloud_hostname)}
                placeholder="my-company.atlassian.net"
                className="w-full"
              />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-1">
          <h3 className="font-semibold">Import to project</h3>
          <p className="text-sm text-custom-text-200">Select which project you want to import to.</p>
        </div>
        <div className="col-span-1">
          <Controller
            control={control}
            name="project_id"
            rules={{ required: "Please select a project." }}
            render={({ field: { value, onChange } }) => (
              <CustomSelect
                value={value}
                input
                width="w-full"
                onChange={onChange}
                label={
                  <span>
                    {value && value !== "" ? (
                      projects?.find((p) => p.id === value)?.name
                    ) : (
                      <span className="text-custom-text-200">Select a project</span>
                    )}
                  </span>
                }
              >
                {projects && projects.length > 0 ? (
                  projects.map((project) => (
                    <CustomSelect.Option key={project.id} value={project.id}>
                      {project.name}
                    </CustomSelect.Option>
                  ))
                ) : (
                  <div className="flex cursor-pointer select-none items-center space-x-2 truncate rounded px-1 py-1.5 text-custom-text-200">
                    <p>You don{"'"}t have any project. Please create a project first.</p>
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setTrackElement("JIRA_IMPORT_DETAIL");
                      commandPaletteStore.toggleCreateProjectModal(true)
                    }}
                    className="flex cursor-pointer select-none items-center space-x-2 truncate rounded px-1 py-1.5 text-custom-text-200"
                  >
                    <Plus className="h-4 w-4 text-custom-text-200" />
                    <span>Create new project</span>
                  </button>
                </div>
              </CustomSelect>
            )}
          />
        </div>
      </div>
    </div>
  );
});
