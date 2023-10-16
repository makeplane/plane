import { useState } from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import { IntegrationService } from "services/integrations";
// hooks
import useToast from "hooks/use-toast";
import useIntegrationPopup from "hooks/use-integration-popup";
// ui
import { Button, Loader } from "@plane/ui";
// icons
import GithubLogo from "public/services/github.png";
import SlackLogo from "public/services/slack.png";
import { CheckCircle2 } from "lucide-react";
// types
import { IAppIntegration, IWorkspaceIntegration } from "types";
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

export const SingleIntegrationCard: React.FC<Props> = ({ integration }) => {
  const [deletingIntegration, setDeletingIntegration] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const { startAuth, isConnecting: isInstalling } = useIntegrationPopup(integration.provider);

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
    <div className="flex items-center justify-between gap-2 border-b border-custom-border-200 bg-custom-background-100 px-4 py-6">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 flex-shrink-0">
          <Image src={integrationDetails[integration.provider].logo} alt={`${integration.title} Logo`} />
        </div>
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium">
            {integration.title}
            {workspaceIntegrations
              ? isInstalled && <CheckCircle2 className="h-3.5 w-3.5 text-white fill-green-500" />
              : null}
          </h3>
          <p className="text-sm text-custom-text-200 tracking-tight">
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
          <Button variant="danger" onClick={handleRemoveIntegration} loading={deletingIntegration}>
            {deletingIntegration ? "Uninstalling..." : "Uninstall"}
          </Button>
        ) : (
          <Button variant="primary" onClick={startAuth} loading={isInstalling}>
            {isInstalling ? "Installing..." : "Install"}
          </Button>
        )
      ) : (
        <Loader>
          <Loader.Item height="35px" width="150px" />
        </Loader>
      )}
    </div>
  );
};
