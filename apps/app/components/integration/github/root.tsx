import { FC, useState } from "react";
// next imports
import Link from "next/link";
import Image from "next/image";
// icons
import GithubLogo from "public/logos/github-square.png";
import { CogIcon, CloudUploadIcon, UsersIcon, ImportLayersIcon, CheckIcon } from "components/icons";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
// components
import {
  GithubConfigure,
  GithubImportData,
  GithubIssuesSelect,
  GithubUsersSelect,
  GithubConfirm,
} from "components/integration";
// types
import { IAppIntegrations, IGithubServiceImportFormData, IWorkspaceIntegrations } from "types";
import { useForm } from "react-hook-form";

type Props = {
  workspaceSlug: string | undefined;
  provider: string | undefined;
  allIntegrations: IAppIntegrations[] | undefined;
  allIntegrationsError: Error | undefined;
  allWorkspaceIntegrations: IWorkspaceIntegrations[] | undefined;
  allWorkspaceIntegrationsError: Error | undefined;
  allIntegrationImporters: any | undefined;
  allIntegrationImportersError: Error | undefined;
};

export interface IIntegrationData {
  state: string;
}

export type TFormValues = {
  github: any;
  project: string | null;
  sync: boolean;
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
    icon: CogIcon,
  },
  {
    title: "Import Data",
    key: "import-import-data",
    icon: CloudUploadIcon,
  },
  { title: "Issues", key: "migrate-issues", icon: UsersIcon },
  {
    title: "Users",
    key: "migrate-users",
    icon: ImportLayersIcon,
  },
  {
    title: "Confirm",
    key: "migrate-confirm",
    icon: CheckIcon,
  },
];

export const GithubIntegrationRoot: FC<Props> = ({
  workspaceSlug,
  provider,
  allIntegrations,
  allIntegrationsError,
  allWorkspaceIntegrations,
  allWorkspaceIntegrationsError,
  allIntegrationImporters,
  allIntegrationImportersError,
}) => {
  const { handleSubmit, setValue, watch } = useForm<TFormValues>({
    defaultValues: defaultFormValues,
  });

  const activeIntegrationState = () => {
    const currentElementIndex = integrationWorkflowData.findIndex(
      (i) => i?.key === integrationData?.state
    );

    return currentElementIndex;
  };

  const [integrationData, setIntegrationData] = useState<IIntegrationData>({
    state: "import-configure",
  });

  const handleIntegrationData = (key: string = "state", value: string) => {
    setIntegrationData((previousData) => ({ ...previousData, [key]: value }));
  };

  // current integration from all the integrations available
  const integration =
    allIntegrations &&
    allIntegrations.length > 0 &&
    allIntegrations.find((i) => i.provider === provider);

  // current integration from workspace integrations
  const workspaceIntegration =
    integration &&
    allWorkspaceIntegrations?.find((i: any) => i.integration_detail.id === integration.id);

  const createGithubImporterService = (formData: TFormValues) => {
    console.log(formData);

    if (!formData.github || !formData.project) return;

    const payload: IGithubServiceImportFormData = {
      metadata: {
        owner: formData.github.owner.login,
        name: "",
        repository_id: formData.github.id,
        url: formData.github.html_url,
      },
      data: {
        users: [],
      },
      config: {
        sync: formData.sync,
      },
      project_id: formData.project,
    };

    console.log(payload);
  };

  console.log(watch("github"), "github");
  console.log(watch("project"), "project");
  console.log(watch("sync"), "sync");

  return (
    <form onSubmit={handleSubmit(createGithubImporterService)}>
      <div className="space-y-4">
        <Link href={`/${workspaceSlug}/settings/import-export`}>
          <div className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
            <div>
              <ArrowLeftIcon className="h-3 w-3" />
            </div>
            <div>Back</div>
          </div>
        </Link>

        <div className="space-y-4 rounded border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 flex-shrink-0">
              <Image src={GithubLogo} alt="GithubLogo" />
            </div>
            <div className="flex h-full w-full items-center justify-center">
              {integrationWorkflowData.map((integration, index) => (
                <>
                  <div
                    key={integration.key}
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border ${
                      index <= activeIntegrationState()
                        ? `border-[#3F76FF] bg-[#3F76FF] text-white ${
                            index === activeIntegrationState()
                              ? "border-opacity-100 bg-opacity-100"
                              : "border-opacity-80 bg-opacity-80"
                          }`
                        : "border-gray-300"
                    }
              `}
                  >
                    <integration.icon
                      width="18px"
                      height="18px"
                      color={index <= activeIntegrationState() ? "#ffffff" : "#d1d5db"}
                    />
                  </div>
                  {index < integrationWorkflowData.length - 1 && (
                    <div
                      key={index}
                      className={`border-b px-7 ${
                        index <= activeIntegrationState() - 1
                          ? `border-[#3F76FF]`
                          : `border-gray-300`
                      }`}
                    >
                      {" "}
                    </div>
                  )}
                </>
              ))}
            </div>
          </div>

          <div className="relative w-full space-y-4">
            <div className="w-full">
              {integrationData?.state === "import-configure" && (
                <GithubConfigure
                  state={integrationData}
                  handleState={handleIntegrationData}
                  workspaceSlug={workspaceSlug}
                  provider={provider}
                  allIntegrations={allIntegrations}
                  allIntegrationsError={allIntegrationsError}
                  allWorkspaceIntegrations={allWorkspaceIntegrations}
                  allWorkspaceIntegrationsError={allWorkspaceIntegrationsError}
                />
              )}
              {integrationData?.state === "import-import-data" && (
                <GithubImportData
                  handleState={handleIntegrationData}
                  integration={workspaceIntegration}
                  watch={watch}
                  setValue={setValue}
                />
              )}
              {integrationData?.state === "migrate-issues" && (
                <GithubIssuesSelect state={integrationData} handleState={handleIntegrationData} />
              )}
              {integrationData?.state === "migrate-users" && (
                <GithubUsersSelect state={integrationData} handleState={handleIntegrationData} />
              )}
              {integrationData?.state === "migrate-confirm" && (
                <GithubConfirm state={integrationData} handleState={handleIntegrationData} />
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
