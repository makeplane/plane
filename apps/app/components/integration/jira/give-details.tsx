import React from "react";

// next
import Link from "next/link";

// react hook form
import { useFormContext, Controller } from "react-hook-form";

// icons
import { PlusIcon } from "@heroicons/react/20/solid";

// hooks
import useProjects from "hooks/use-projects";

// components
import { Input, CustomSelect } from "components/ui";

import { IJiraImporterForm } from "types";

export const JiraGetImportDetail: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<IJiraImporterForm>();

  const { projects } = useProjects();

  return (
    <div className="h-full w-full space-y-8 overflow-y-auto">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-1">
          <h3 className="text-lg font-semibold">Jira Personal Access Token</h3>
          <p className="text-sm text-gray-500">
            Get to know your access token by navigating to{" "}
            <Link href="https://id.atlassian.com/manage-profile/security/api-tokens">
              <a
                className="font-medium text-gray-600 hover:text-gray-900"
                target="_blank"
                rel="noreferrer"
              >
                Atlassian Settings
              </a>
            </Link>
          </p>
        </div>

        <div className="col-span-1">
          <Input
            id="metadata.api_token"
            name="metadata.api_token"
            placeholder="XXXXXXXX"
            validations={{
              required: "Please enter your personal access token.",
            }}
            register={register}
            error={errors.metadata?.api_token}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-1">
          <h3 className="text-lg font-semibold">Jira Project Key</h3>
          <p className="text-sm text-gray-500">If XXX-123 is your issue, then enter XXX</p>
        </div>
        <div className="col-span-1">
          <Input
            id="metadata.project_key"
            name="metadata.project_key"
            placeholder="LIN"
            register={register}
            validations={{
              required: "Please enter your project key.",
            }}
            error={errors.metadata?.project_key}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-1">
          <h3 className="text-lg font-semibold">Jira Email Address</h3>
          <p className="text-sm text-gray-500">
            Enter the Gmail account that you use in Jira account
          </p>
        </div>
        <div className="col-span-1">
          <Input
            id="metadata.email"
            name="metadata.email"
            type="email"
            placeholder="name@company.com"
            register={register}
            validations={{
              required: "Please enter email address.",
            }}
            error={errors.metadata?.email}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-1">
          <h3 className="text-lg font-semibold">Jira Installation or Cloud Host Name</h3>
          <p className="text-sm text-gray-500">Enter your companies cloud host name</p>
        </div>
        <div className="col-span-1">
          <Input
            id="metadata.cloud_hostname"
            name="metadata.cloud_hostname"
            type="email"
            placeholder="my-company.atlassian.net"
            register={register}
            validations={{
              required: "Please enter your cloud host name.",
            }}
            error={errors.metadata?.cloud_hostname}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-1">
          <h3 className="text-lg font-semibold">Import to project</h3>
          <p className="text-sm text-gray-500">Select which project you want to import to.</p>
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
                    {value && value !== ""
                      ? projects.find((p) => p.id === value)?.name
                      : "Select Project"}
                  </span>
                }
              >
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <CustomSelect.Option key={project.id} value={project.id}>
                      {project.name}
                    </CustomSelect.Option>
                  ))
                ) : (
                  <div className="flex cursor-pointer select-none items-center space-x-2 truncate rounded px-1 py-1.5 text-gray-500">
                    <p>You don{"'"}t have any project. Please create a project first.</p>
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const event = new KeyboardEvent("keydown", { key: "p" });
                      document.dispatchEvent(event);
                    }}
                    className="flex cursor-pointer select-none items-center space-x-2 truncate rounded px-1 py-1.5 text-gray-500"
                  >
                    <PlusIcon className="h-4 w-4 text-gray-500" />
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
};
