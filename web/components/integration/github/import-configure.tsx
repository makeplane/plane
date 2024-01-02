// components
import { Button } from "@plane/ui";
import { GithubAuth, TIntegrationSteps } from "components/integration";
// types
import { IAppIntegration, IWorkspaceIntegration } from "@plane/types";

type Props = {
  provider: string | undefined;
  handleStepChange: (value: TIntegrationSteps) => void;
  appIntegrations: IAppIntegration[] | undefined;
  workspaceIntegrations: IWorkspaceIntegration[] | undefined;
};

export const GithubImportConfigure: React.FC<Props> = ({
  handleStepChange,
  provider,
  appIntegrations,
  workspaceIntegrations,
}) => {
  // current integration from all the integrations available
  const integration =
    appIntegrations && appIntegrations.length > 0 && appIntegrations.find((i) => i.provider === provider);

  // current integration from workspace integrations
  const workspaceIntegration =
    integration &&
    workspaceIntegrations &&
    workspaceIntegrations.length > 0 &&
    workspaceIntegrations.find((i: any) => i.integration_detail.id === integration.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 py-5">
        <div className="w-full">
          <div className="font-medium">Configure</div>
          <div className="text-sm text-custom-text-200">Set up your GitHub import.</div>
        </div>
        <div className="flex-shrink-0">
          <GithubAuth workspaceIntegration={workspaceIntegration} provider={provider} />
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button
          variant="primary"
          onClick={() => handleStepChange("import-data")}
          disabled={workspaceIntegration && workspaceIntegration?.id ? false : true}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
