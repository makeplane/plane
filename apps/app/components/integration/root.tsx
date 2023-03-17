import { FC, useState } from "react";
// icons
import { ArrowDownIcon } from "@heroicons/react/24/outline";
// components
import {
  ImportMigrationAssistantSelectSource,
  GithubConfigure,
  GithubImportData,
  GithubIssuesSelect,
  GithubUsersSelect,
  GithubConfirm,
} from "components/integration";
// types
import { IAppIntegrations } from "types";

type Props = {
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

const IntegrationRoot: FC<Props> = ({
  allIntegrations,
  allIntegrationsError,
  allWorkspaceIntegrations,
  allWorkspaceIntegrationsError,
  allIntegrationImporters,
  allIntegrationImportersError,
}) => {
  const integrationWorkflowData = [
    {
      groupBy: "import",
      groupTitle: "Import",
      process: [
        {
          title: "Select Source",
          key: "import-select-source",
        },
        {
          title: "Configure",
          key: "import-configure",
        },
        {
          title: "Import Data",
          key: "import-import-data",
        },
      ],
    },
    {
      groupBy: "migrate",
      groupTitle: "Migrate",
      process: [
        { title: "Issues", key: "migrate-issues" },
        {
          title: "Users",
          key: "migrate-users",
        },
        {
          title: "Confirm",
          key: "migrate-confirm",
        },
      ],
    },
  ];

  const renderCurrentIntegrationState = (key: string) => {
    const currentStateData: (string | undefined)[] = integrationWorkflowData
      .map((integration) => {
        const currentState = integration.process.find((process) => process.key === key);
        if (currentState && currentState?.title) return currentState?.title;
      })
      .filter((value) => value);

    return currentStateData;
  };

  const [integrationData, setIntegrationData] = useState<IIntegrationData>({
    state: "import-select-source",
  });
  const handleIntegrationData = (key: string = "state", value: string) => {
    setIntegrationData((previousData) => ({ ...previousData, [key]: value }));
  };

  return (
    <div className="relative flex overflow-hidden rounded bg-white shadow">
      <div className="w-[200px] flex-shrink-0 space-y-8 border-r border-gray-200 p-5 px-4">
        {integrationWorkflowData.map((integration) => (
          <div key={integration?.groupBy}>
            <div className="flex items-center gap-3">
              <div className="flex h-[24px] w-[24px] flex-shrink-0 items-center justify-center rounded-sm bg-gray-100">
                <ArrowDownIcon className="h-3 w-3" />
              </div>
              <div className="w-full font-medium">{integration?.groupTitle}</div>
            </div>
            <div className="pt-3 pl-[36px]">
              {integration.process.map((process) => (
                <div
                  key={process?.key}
                  className={`py-2 text-sm font-medium ${
                    process?.key === integrationData?.state ? `text-indigo-500` : ``
                  }`}
                >
                  {process?.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="relative w-full space-y-4 overflow-hidden p-5 px-4">
        <div className="relative flex items-center gap-3">
          <div className="flex h-[24px] w-[24px] flex-shrink-0 items-center justify-center rounded-sm bg-gray-100">
            <ArrowDownIcon className="h-3 w-3" />
          </div>
          <div className="w-full font-medium">
            {renderCurrentIntegrationState(integrationData?.state)}
          </div>
        </div>

        <div className="w-full">
          {integrationData?.state === "import-select-source" && (
            <ImportMigrationAssistantSelectSource
              state={integrationData}
              handleState={handleIntegrationData}
              allIntegrations={allIntegrations}
              allIntegrationsError={allIntegrationsError}
              allIntegrationImporters={allIntegrationImporters}
              allIntegrationImportersError={allIntegrationImportersError}
            />
          )}
          {integrationData?.state === "import-configure" && (
            <GithubConfigure state={integrationData} handleState={handleIntegrationData} />
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
  );
};

export default IntegrationRoot;
