// hooks
import useIntegrationPopup from "hooks/use-integration-popup";
// ui
import { Button } from "@plane/ui";
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
        <Button variant="primary" disabled>
          Successfully Connected
        </Button>
      ) : (
        <Button variant="primary" onClick={startAuth} loading={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect"}
        </Button>
      )}
    </div>
  );
};
