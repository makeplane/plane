import { FC } from "react";

import { useRouter } from "next/router";

// components
import { GithubAuth, TIntegrationSteps } from "components/integration";
// ui
import { PrimaryButton } from "components/ui";
// types
import { IAppIntegrations, IWorkspaceIntegrations } from "types";

type Props = {
  provider: string | undefined;
  handleStepChange: (value: TIntegrationSteps) => void;
  appIntegrations: IAppIntegrations[] | undefined;
  workspaceIntegrations: IWorkspaceIntegrations[] | undefined;
};

export const GithubImportConfigure: FC<Props> = ({
  handleStepChange,
  provider,
  appIntegrations,
  workspaceIntegrations,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  // current integration from all the integrations available
  const integration =
    appIntegrations &&
    appIntegrations.length > 0 &&
    appIntegrations.find((i) => i.provider === provider);

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
          <div className="text-sm text-gray-600">Set up your GitHub import.</div>
        </div>
        <div className="flex-shrink-0">
          <GithubAuth
            workspaceSlug={workspaceSlug as string}
            workspaceIntegration={workspaceIntegration}
          />
        </div>
      </div>

      <div className="flex items-center justify-end">
        <PrimaryButton
          onClick={() => handleStepChange("import-data")}
          disabled={workspaceIntegration && workspaceIntegration?.id ? false : true}
        >
          Next
        </PrimaryButton>
      </div>
    </div>
  );
};
