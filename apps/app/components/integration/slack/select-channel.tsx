import React,{useState} from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";
// services
import projectService from "services/project.service";
import IntegrationService from "services/integration";

// ui
import { DangerButton, Loader, SecondaryButton } from "components/ui";
// hooks
import useToast from "hooks/use-toast";
import useIntegrationPopup from "hooks/use-integration-popup";
// types
import { IAppIntegration, IWorkspaceIntegration } from "types";
// fetch-keys
import { WORKSPACE_INTEGRATIONS } from "constants/fetch-keys";



type Props = {
  integration: IWorkspaceIntegration;
};

export const SelectChannel: React.FC<Props> = ({
  integration,
}) => {
    const [deletingIntegration, setDeletingIntegration] = useState(false);

    const router = useRouter();
    const { workspaceSlug } = router.query;

    const { setToastAlert } = useToast();

    const { startAuth, isConnecting: isInstalling } = useIntegrationPopup("slackChannel");

    const { data: workspaceIntegrations } = useSWR(
      workspaceSlug ? WORKSPACE_INTEGRATIONS(workspaceSlug as string) : null,
      () =>
        workspaceSlug
          ? IntegrationService.getWorkspaceIntegrationsList(workspaceSlug as string)
          : null
  );

  const isInstalled = workspaceIntegrations?.find(
    (i: any) => i.integration_detail.id === integration.id
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
          setDeletingIntegration(false);
        })
        .catch(() => {
          setDeletingIntegration(false);
        });
    };

  return (
    <>
      {workspaceIntegrations ? (
        isInstalled ? (
          <DangerButton onClick={handleRemoveIntegration} loading={deletingIntegration}>
            {deletingIntegration ? "Removing..." : "Remove channel"}
          </DangerButton>
        ) : (
          <SecondaryButton onClick={startAuth} loading={isInstalling}>
            {isInstalling ? "Adding..." : "Add channel"}
          </SecondaryButton>
        )
      ) : (
        <Loader>
          <Loader.Item height="35px" width="150px" />
        </Loader>
      )}
    </>
  );
};
