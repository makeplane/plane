// hooks
import useIntegrationPopup from "hooks/use-integration-popup";
// ui
import { PrimaryButton } from "components/ui";
// types
import { IWorkspaceIntegration } from "types";

type Props = {
  workspaceIntegration: false | IWorkspaceIntegration | undefined;
  provider: string | undefined;
};

export const GithubAuth: React.FC<Props> = ({ workspaceIntegration, provider }) => {
  const { startAuth, isConnecting } = useIntegrationPopup(provider);

  return (
    <div>
      {workspaceIntegration && workspaceIntegration?.id ? (
        <PrimaryButton disabled>Successfully Connected</PrimaryButton>
      ) : (
        <PrimaryButton onClick={startAuth} loading={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect"}
        </PrimaryButton>
      )}
    </div>
  );
};
