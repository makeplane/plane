"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import useSWR, { mutate } from "swr";
import { ArrowLeft, Check, List, Settings, UploadCloud, Users } from "lucide-react";
// types
import { IGithubRepoCollaborator, IGithubServiceImportFormData } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import {
  GithubImportConfigure,
  GithubImportData,
  GithubRepoDetails,
  GithubImportUsers,
  GithubImportConfirm,
} from "@/components/integration";
// fetch keys
import { APP_INTEGRATIONS, IMPORTER_SERVICES_LIST, WORKSPACE_INTEGRATIONS } from "@/constants/fetch-keys";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// images
import GithubLogo from "@/public/services/github.png";
// services
import { IntegrationService, GithubIntegrationService } from "@/services/integrations";

export type TIntegrationSteps = "import-configure" | "import-data" | "repo-details" | "import-users" | "import-confirm";
export interface IIntegrationData {
  state: TIntegrationSteps;
}

export interface IUserDetails {
  username: string;
  import: any;
  email: string;
}

export type TFormValues = {
  github: any;
  project: string | null;
  sync: boolean;
  collaborators: IGithubRepoCollaborator[];
  users: IUserDetails[];
};

const defaultFormValues = {
  github: null,
  project: null,
  sync: false,
};

const integrationWorkflowData = [
  {
    title: "Configure",
    key: "import-configure",
    icon: Settings,
  },
  {
    title: "Import Data",
    key: "import-data",
    icon: UploadCloud,
  },
  { title: "Work item", key: "repo-details", icon: List },
  {
    title: "Users",
    key: "import-users",
    icon: Users,
  },
  {
    title: "Confirm",
    key: "import-confirm",
    icon: Check,
  },
];

// services
const integrationService = new IntegrationService();
const githubIntegrationService = new GithubIntegrationService();

export const GithubImporterRoot: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<IIntegrationData>({
    state: "import-configure",
  });
  const [users, setUsers] = useState<IUserDetails[]>([]);

  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider");

  const { handleSubmit, control, setValue, watch } = useForm<TFormValues>({
    defaultValues: defaultFormValues,
  });

  const { data: appIntegrations } = useSWR(APP_INTEGRATIONS, () => integrationService.getAppIntegrationsList());

  const { data: workspaceIntegrations } = useSWR(
    workspaceSlug ? WORKSPACE_INTEGRATIONS(workspaceSlug as string) : null,
    workspaceSlug ? () => integrationService.getWorkspaceIntegrationsList(workspaceSlug as string) : null
  );

  const activeIntegrationState = () => {
    const currentElementIndex = integrationWorkflowData.findIndex((i) => i?.key === currentStep?.state);

    return currentElementIndex;
  };

  const handleStepChange = (value: TIntegrationSteps) => {
    setCurrentStep((prevData) => ({ ...prevData, state: value }));
  };

  // current integration from all the integrations available
  const integration =
    appIntegrations && appIntegrations.length > 0 && appIntegrations.find((i) => i.provider === provider);

  // current integration from workspace integrations
  const workspaceIntegration =
    integration && workspaceIntegrations?.find((i: any) => i.integration_detail.id === integration.id);

  const createGithubImporterService = async (formData: TFormValues) => {
    if (!formData.github || !formData.project) return;

    const payload: IGithubServiceImportFormData = {
      metadata: {
        owner: formData.github.owner.login,
        name: formData.github.name,
        repository_id: formData.github.id,
        url: formData.github.html_url,
      },
      data: {
        users: users,
      },
      config: {
        sync: formData.sync,
      },
      project_id: formData.project,
    };

    await githubIntegrationService
      .createGithubServiceImport(workspaceSlug as string, payload)
      .then(() => {
        router.push(`/${workspaceSlug}/settings/imports`);
        mutate(IMPORTER_SERVICES_LIST(workspaceSlug as string));
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Import was unsuccessful. Please try again.",
        })
      );
  };

  return (
    <form onSubmit={handleSubmit(createGithubImporterService)}>
      <div className="mt-4 space-y-2">
        <Link href={`/${workspaceSlug}/settings/imports`}>
          <span className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-custom-text-200 hover:text-custom-text-100">
            <ArrowLeft className="h-3 w-3" />
            <div>Cancel import & go back</div>
          </span>
        </Link>

        <div className="space-y-4 rounded-[10px] border border-custom-border-200 bg-custom-background-100 p-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 flex-shrink-0">
              <Image src={GithubLogo} alt="GitHubLogo" />
            </div>
            <div className="flex h-full w-full items-center justify-center">
              {integrationWorkflowData.map((integration, index) => (
                <React.Fragment key={integration.key}>
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border ${
                      index <= activeIntegrationState()
                        ? `border-custom-primary bg-custom-primary ${
                            index === activeIntegrationState()
                              ? "border-opacity-100 bg-opacity-100"
                              : "border-opacity-80 bg-opacity-80"
                          }`
                        : "border-custom-border-200"
                    }`}
                  >
                    <integration.icon
                      className={`h-5 w-5 ${index <= activeIntegrationState() ? "text-white" : "text-custom-text-400"}`}
                    />
                  </div>
                  {index < integrationWorkflowData.length - 1 && (
                    <div
                      key={index}
                      className={`border-b px-7 ${
                        index <= activeIntegrationState() - 1 ? `border-custom-primary` : `border-custom-border-200`
                      }`}
                    >
                      {" "}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="relative w-full space-y-4">
            <div className="w-full">
              {currentStep?.state === "import-configure" && (
                <GithubImportConfigure
                  handleStepChange={handleStepChange}
                  provider={provider as string}
                  appIntegrations={appIntegrations}
                  workspaceIntegrations={workspaceIntegrations}
                />
              )}
              {currentStep?.state === "import-data" && (
                <GithubImportData
                  handleStepChange={handleStepChange}
                  integration={workspaceIntegration}
                  control={control}
                  watch={watch}
                />
              )}
              {currentStep?.state === "repo-details" && (
                <GithubRepoDetails
                  selectedRepo={watch("github")}
                  handleStepChange={handleStepChange}
                  setUsers={setUsers}
                  setValue={setValue}
                />
              )}
              {currentStep?.state === "import-users" && (
                <GithubImportUsers
                  handleStepChange={handleStepChange}
                  users={users}
                  setUsers={setUsers}
                  watch={watch}
                />
              )}
              {currentStep?.state === "import-confirm" && (
                <GithubImportConfirm handleStepChange={handleStepChange} watch={watch} />
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
