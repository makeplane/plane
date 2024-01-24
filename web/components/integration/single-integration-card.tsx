import { useState } from "react";

import Image from "next/image";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR, { mutate } from "swr";
// services
import { IntegrationService } from "services/integrations";
// hooks
import { useApplication, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
import useIntegrationPopup from "hooks/use-integration-popup";
// ui
import { Button, Loader, Tooltip } from "@plane/ui";
// icons
import GithubLogo from "public/services/github.png";
import SlackLogo from "public/services/slack.png";
import { CheckCircle } from "lucide-react";
// types
import { IAppIntegration, IWorkspaceIntegration } from "@plane/types";
// fetch-keys
import { WORKSPACE_INTEGRATIONS } from "constants/fetch-keys";

type Props = {
  integration: IAppIntegration;
};

const integrationDetails: { [key: string]: any } = {
  github: {
    logo: GithubLogo,
    installed: "Activate GitHub on individual projects to sync with specific repositories.",
    notInstalled: "Connect with GitHub with your Plane workspace to sync project issues.",
  },
  slack: {
    logo: SlackLogo,
    installed: "Activate Slack on individual projects to sync with specific channels.",
    notInstalled: "Connect with Slack with your Plane workspace to sync project issues.",
  },
};

// services
const integrationService = new IntegrationService();

export const SingleIntegrationCard: React.FC<Props> = observer(({ integration }) => {
  // states
  const [deletingIntegration, setDeletingIntegration] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    config: { envConfig },
  } = useApplication();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // toast alert
  const { setToastAlert } = useToast();

  const isUserAdmin = currentWorkspaceRole === 20;

  const { startAuth, isConnecting: isInstalling } = useIntegrationPopup({
    provider: integration.provider,
    github_app_name: envConfig?.github_app_name || "",
    slack_client_id: envConfig?.slack_client_id || "",
  });

  const { data: workspaceIntegrations } = useSWR(
    workspaceSlug ? WORKSPACE_INTEGRATIONS(workspaceSlug as string) : null,
    () => (workspaceSlug ? integrationService.getWorkspaceIntegrationsList(workspaceSlug as string) : null)
  );

  const handleRemoveIntegration = async () => {
    if (!workspaceSlug || !integration || !workspaceIntegrations) return;

    const workspaceIntegrationId = workspaceIntegrations?.find((i) => i.integration === integration.id)?.id;

    setDeletingIntegration(true);

    await integrationService
      .deleteWorkspaceIntegration(workspaceSlug as string, workspaceIntegrationId ?? "")
      .then(() => {
        mutate<IWorkspaceIntegration[]>(
          WORKSPACE_INTEGRATIONS(workspaceSlug as string),
          (prevData) => prevData?.filter((i) => i.id !== workspaceIntegrationId),
          false
        );
        setDeletingIntegration(false);

        setToastAlert({
          type: "success",
          title: "Deleted successfully!",
          message: `${integration.title} integration deleted successfully.`,
        });
      })
      .catch(() => {
        setDeletingIntegration(false);

        setToastAlert({
          type: "error",
          title: "Error!",
          message: `${integration.title} integration could not be deleted. Please try again.`,
        });
      });
  };

  const isInstalled = workspaceIntegrations?.find((i: any) => i.integration_detail.id === integration.id);

  return (
    <div className="flex items-center justify-between gap-2 border-b border-custom-border-100 bg-custom-background-100 px-4 py-6">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 flex-shrink-0">
          <Image src={integrationDetails[integration.provider].logo} alt={`${integration.title} Logo`} />
        </div>
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium">
            {integration.title}
            {workspaceIntegrations
              ? isInstalled && <CheckCircle className="h-3.5 w-3.5 fill-transparent text-green-500" />
              : null}
          </h3>
          <p className="text-sm tracking-tight text-custom-text-200">
            {workspaceIntegrations
              ? isInstalled
                ? integrationDetails[integration.provider].installed
                : integrationDetails[integration.provider].notInstalled
              : "Loading..."}
          </p>
        </div>
      </div>

      {workspaceIntegrations ? (
        isInstalled ? (
          <Tooltip
            disabled={isUserAdmin}
            tooltipContent={!isUserAdmin ? "You don't have permission to perform this" : null}
          >
            <Button
              className={`${!isUserAdmin ? "hover:cursor-not-allowed" : ""}`}
              variant="danger"
              onClick={() => {
                if (!isUserAdmin) return;
                handleRemoveIntegration();
              }}
              disabled={!isUserAdmin}
              loading={deletingIntegration}
            >
              {deletingIntegration ? "Uninstalling..." : "Uninstall"}
            </Button>
          </Tooltip>
        ) : (
          <Tooltip
            disabled={isUserAdmin}
            tooltipContent={!isUserAdmin ? "You don't have permission to perform this" : null}
          >
            <Button
              className={`${!isUserAdmin ? "hover:cursor-not-allowed" : ""}`}
              variant="primary"
              onClick={() => {
                if (!isUserAdmin) return;
                startAuth();
              }}
              loading={isInstalling}
            >
              {isInstalling ? "Installing..." : "Install"}
            </Button>
          </Tooltip>
        )
      ) : (
        <Loader>
          <Loader.Item height="35px" width="150px" />
        </Loader>
      )}
    </div>
  );
});
