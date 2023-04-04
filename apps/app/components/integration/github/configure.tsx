import { FC } from "react";
// components
import { IIntegrationData, GithubAuth } from "components/integration";
// types
import { IAppIntegrations } from "types";
import { PrimaryButton } from "components/ui";

type Props = {
  state: IIntegrationData;
  provider: string | undefined;
  handleState: (key: string, valve: any) => void;
  workspaceSlug: string | undefined;
  allIntegrations: IAppIntegrations[] | undefined;
  allIntegrationsError: Error | undefined;
  allWorkspaceIntegrations: any | undefined;
  allWorkspaceIntegrationsError: Error | undefined;
};

export const GithubConfigure: FC<Props> = ({
  state,
  handleState,
  workspaceSlug,
  provider,
  allIntegrations,
  allIntegrationsError,
  allWorkspaceIntegrations,
  allWorkspaceIntegrationsError,
}) => {
  // current integration from all the integrations available
  const integration =
    allIntegrations &&
    allIntegrations.length > 0 &&
    allIntegrations.find((i) => i.provider === provider);

  // current integration from workspace integrations
  const workspaceIntegration =
    integration &&
    allWorkspaceIntegrations &&
    allWorkspaceIntegrations.length > 0 &&
    allWorkspaceIntegrations.find((i: any) => i.integration_detail.id === integration.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 py-5">
        <div className="w-full">
          <div className="font-medium">Configure</div>
          <div className="text-sm text-gray-600">Set up your Github import</div>
        </div>
        <div className="flex-shrink-0">
          <GithubAuth workspaceSlug={workspaceSlug} workspaceIntegration={workspaceIntegration} />
        </div>
      </div>

      <div className="flex items-center justify-end">
        <PrimaryButton
          onClick={() => handleState("state", "import-import-data")}
          disabled={workspaceIntegration && workspaceIntegration?.id ? false : true}
        >
          Next
        </PrimaryButton>
      </div>
    </div>
  );
};
