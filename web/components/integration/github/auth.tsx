import { observer } from "mobx-react-lite";
import { IWorkspaceIntegration } from "@plane/types";
// hooks
import { Button } from "@plane/ui";
import { useApplication } from "@/hooks/store";
import useIntegrationPopup from "@/hooks/use-integration-popup";
// ui
// types

type Props = {
  workspaceIntegration: false | IWorkspaceIntegration | undefined;
  provider: string | undefined;
};

export const GithubAuth: React.FC<Props> = observer(({ workspaceIntegration, provider }) => {
  // store hooks
  const {
    config: { envConfig },
  } = useApplication();
  // hooks
  const { startAuth, isConnecting } = useIntegrationPopup({
    provider,
    github_app_name: envConfig?.github_app_name || "",
    slack_client_id: envConfig?.slack_client_id || "",
  });

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
});
