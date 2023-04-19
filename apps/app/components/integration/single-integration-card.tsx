import { useState } from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import IntegrationService from "services/integration";
// hooks
import useToast from "hooks/use-toast";
import useIntegrationPopup from "hooks/use-integration-popup";
// ui
import { DangerButton, Loader, SecondaryButton } from "components/ui";
// icons
import GithubLogo from "public/services/github.png";
import SlackLogo from "public/services/slack.png";
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
    installed:
      "Activate GitHub integrations on individual projects to sync with specific repositories.",
    notInstalled: "Connect with GitHub with your Plane workspace to sync project issues.",
  },
  slack: {
    logo: SlackLogo,
    installed: "Activate Slack integrations on individual projects to sync with specific cahnnels.",
    notInstalled: "Connect with Slack with your Plane workspace to sync project issues.",
  },
};

export const SingleIntegrationCard: React.FC<Props> = ({ integration }) => {
  const [deletingIntegration, setDeletingIntegration] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const { startAuth, isConnecting: isInstalling } = useIntegrationPopup(integration.provider);

  const { data: workspaceIntegrations } = useSWR(
    workspaceSlug ? WORKSPACE_INTEGRATIONS(workspaceSlug as string) : null,
    () =>
      workspaceSlug
        ? IntegrationService.getWorkspaceIntegrationsList(workspaceSlug as string)
        : null
  );

  const handleRemoveIntegration = async () => {
    if (!workspaceSlug || !integration || !workspaceIntegrations) return;

    const workspaceIntegrationId = workspaceIntegrations?.find(
      (i) => i.integration === integration.id
    )?.id;

    setDeletingIntegration(true);

    await IntegrationService.deleteWorkspaceIntegration(
      workspaceSlug as string,
      workspaceIntegrationId ?? ""
    )
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

  const isInstalled = workspaceIntegrations?.find(
    (i: any) => i.integration_detail.id === integration.id
  );

  return (
    <div className="flex items-center justify-between gap-2 rounded-[10px] border bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 flex-shrink-0">
          <Image
            src={integrationDetails[integration.provider].logo}
            alt={`${integration.title} Logo`}
          />
        </div>
        <div>
          <h3 className="flex items-center gap-4 text-xl font-semibold">
            {integration.title}
            {workspaceIntegrations ? (
              isInstalled ? (
                <span className="flex items-center gap-1 text-sm font-normal text-green-500">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" /> Installed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm font-normal text-gray-400">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" /> Not
                  Installed
                </span>
              )
            ) : null}
          </h3>
          <p className="text-sm text-gray-400">
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
          <DangerButton onClick={handleRemoveIntegration} loading={deletingIntegration}>
            {deletingIntegration ? "Removing..." : "Remove installation"}
          </DangerButton>
        ) : (
          <SecondaryButton onClick={startAuth} loading={isInstalling}>
            {isInstalling ? "Installing..." : "Add installation"}
          </SecondaryButton>
        )
      ) : (
        <Loader>
          <Loader.Item height="35px" width="150px" />
        </Loader>
      )}
    </div>
  );
};
