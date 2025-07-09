"use client";

import React, { useEffect } from "react";

// next
import { useParams } from "next/navigation";

// swr
import { useFormContext, Controller } from "react-hook-form";
import useSWR from "swr";
import { IJiraImporterForm, IJiraMetadata } from "@plane/types";

// react hook form

// services
import { ToggleSwitch, Spinner } from "@plane/ui";
import { JIRA_IMPORTER_DETAIL } from "@/constants/fetch-keys";
import { JiraImporterService } from "@/services/integrations";

// fetch keys

// components

import type { IJiraIntegrationData, TJiraIntegrationSteps } from ".";

type Props = {
  setCurrentStep: React.Dispatch<React.SetStateAction<IJiraIntegrationData>>;
  setDisableTopBarAfter: React.Dispatch<React.SetStateAction<TJiraIntegrationSteps | null>>;
};

// services
const jiraImporterService = new JiraImporterService();

export const JiraProjectDetail: React.FC<Props> = (props) => {
  const { setCurrentStep, setDisableTopBarAfter } = props;

  const {
    watch,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<IJiraImporterForm>();

  const { workspaceSlug } = useParams();

  const params: IJiraMetadata = {
    api_token: watch("metadata.api_token"),
    project_key: watch("metadata.project_key"),
    email: watch("metadata.email"),
    cloud_hostname: watch("metadata.cloud_hostname"),
  };

  const { data: projectInfo, error } = useSWR(
    workspaceSlug &&
      !errors.metadata?.api_token &&
      !errors.metadata?.project_key &&
      !errors.metadata?.email &&
      !errors.metadata?.cloud_hostname
      ? JIRA_IMPORTER_DETAIL(workspaceSlug.toString(), params)
      : null,
    workspaceSlug &&
      !errors.metadata?.api_token &&
      !errors.metadata?.project_key &&
      !errors.metadata?.email &&
      !errors.metadata?.cloud_hostname
      ? () => jiraImporterService.getJiraProjectInfo(workspaceSlug.toString(), params)
      : null
  );

  useEffect(() => {
    if (!projectInfo) return;

    setValue("data.total_issues", projectInfo.issues);
    setValue("data.total_labels", projectInfo.labels);
    setValue(
      "data.users",
      projectInfo.users?.map((user) => ({
        email: user.emailAddress,
        import: false,
        username: user.displayName,
      }))
    );
    setValue("data.total_states", projectInfo.states);
    setValue("data.total_modules", projectInfo.modules);
  }, [projectInfo, setValue]);

  useEffect(() => {
    if (error) setDisableTopBarAfter("display-import-data");
    else setDisableTopBarAfter(null);
  }, [error, setDisableTopBarAfter]);

  useEffect(() => {
    if (!projectInfo && !error) setDisableTopBarAfter("display-import-data");
    else if (!error) setDisableTopBarAfter(null);
  }, [projectInfo, error, setDisableTopBarAfter]);

  if (!projectInfo && !error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-custom-text-200">
          Something went wrong. Please{" "}
          <button
            onClick={() => setCurrentStep({ state: "import-configure" })}
            type="button"
            className="inline text-custom-primary underline"
          >
            go back
          </button>{" "}
          and check your Jira project details.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full space-y-10 overflow-y-auto">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-1">
          <h3 className="font-semibold">Import Data</h3>
          <p className="text-sm text-custom-text-200">Import Completed. We have found:</p>
        </div>
        <div className="col-span-1 flex items-center justify-between">
          <div>
            <h4 className="mb-2 text-lg font-semibold">{projectInfo?.issues}</h4>
            <p className="text-sm text-custom-text-200">Work items</p>
          </div>
          <div>
            <h4 className="mb-2 text-lg font-semibold">{projectInfo?.states}</h4>
            <p className="text-sm text-custom-text-200">States</p>
          </div>
          <div>
            <h4 className="mb-2 text-lg font-semibold">{projectInfo?.modules}</h4>
            <p className="text-sm text-custom-text-200">Modules</p>
          </div>
          <div>
            <h4 className="mb-2 text-lg font-semibold">{projectInfo?.labels}</h4>
            <p className="text-sm text-custom-text-200">Labels</p>
          </div>
          <div>
            <h4 className="mb-2 text-lg font-semibold">{projectInfo?.users?.length}</h4>
            <p className="text-sm text-custom-text-200">Users</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-1">
          <h3 className="font-semibold">Import Epics</h3>
          <p className="text-sm text-custom-text-200">Import epics as modules</p>
        </div>
        <div className="col-span-1">
          <Controller
            control={control}
            name="config.epics_to_modules"
            render={({ field: { value, onChange } }) => <ToggleSwitch onChange={onChange} value={value} />}
          />
        </div>
      </div>
    </div>
  );
};
