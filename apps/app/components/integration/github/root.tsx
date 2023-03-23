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
import { IAppIntegrations } from "types";

type Props = {
  workspaceSlug: string | undefined;
  provider: string | undefined;
  allIntegrations: IAppIntegrations[] | undefined;
  allIntegrationsError: Error | undefined;
  allWorkspaceIntegrations: any | undefined;
  allWorkspaceIntegrationsError: Error | undefined;
  allIntegrationImporters: any | undefined;
  allIntegrationImportersError: Error | undefined;
};

export interface IIntegrationData {
  state: string;
}

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
  const activeIntegrationState = () => {
    const currentElementIndex = integrationWorkflowData.findIndex(
      (_item) => _item?.key === integrationData?.state
    );

    return currentElementIndex;
  };

  const [integrationData, setIntegrationData] = useState<IIntegrationData>({
    state: "import-configure",
  });
  const handleIntegrationData = (key: string = "state", value: string) => {
    setIntegrationData((previousData) => ({ ...previousData, [key]: value }));
  };

  return (
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
            {integrationWorkflowData.map((_integration, _idx) => (
              <>
                <div
                  key={_integration?.key}
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border
              ${
                _idx <= activeIntegrationState()
                  ? `border-[#3F76FF] bg-[#3F76FF] text-white ${
                      _idx === activeIntegrationState()
                        ? `border-opacity-100 bg-opacity-100`
                        : `border-opacity-80 bg-opacity-80`
                    }`
                  : `border-gray-300`
              }
              `}
                >
                  <_integration.icon
                    width={`18px`}
                    height={`18px`}
                    color={_idx <= activeIntegrationState() ? "#ffffff" : "#d1d5db"}
                  />
                </div>
                {_idx < integrationWorkflowData.length - 1 && (
                  <div
                    key={_idx}
                    className={`border-b  px-7 ${
                      _idx <= activeIntegrationState() - 1 ? `border-[#3F76FF]` : `border-gray-300`
                    }`}
                  >
                    {" "}
                  </div>
                )}
              </>
            ))}
          </div>
        </div>

        <div className="relative w-full space-y-4 overflow-hidden">
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
              <GithubImportData state={integrationData} handleState={handleIntegrationData} />
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
  );
};
