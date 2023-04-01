import React, { useRef, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import workspaceService from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { DangerButton, Loader, SecondaryButton } from "components/ui";
// icons
import GithubLogo from "public/logos/github-square.png";
// types
import { IWorkspaceIntegrations } from "types";
// fetch-keys
import { WORKSPACE_INTEGRATIONS } from "constants/fetch-keys";

const OAuthPopUp = ({ integration }: any) => {
  const [deletingIntegration, setDeletingIntegration] = useState(false);

  const popup = useRef<any>();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const checkPopup = () => {
    const check = setInterval(() => {
      if (!popup || popup.current.closed || popup.current.closed === undefined) {
        clearInterval(check);
      }
    }, 1000);
  };

  const openPopup = () => {
    const width = 600,
      height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    const url = `https://github.com/apps/${
      process.env.NEXT_PUBLIC_GITHUB_APP_NAME
    }/installations/new?state=${workspaceSlug as string}`;

    return window.open(url, "", `width=${width}, height=${height}, top=${top}, left=${left}`);
  };

  const startAuth = () => {
    popup.current = openPopup();
    checkPopup();
  };

  const { data: workspaceIntegrations } = useSWR(
    workspaceSlug ? WORKSPACE_INTEGRATIONS(workspaceSlug as string) : null,
    () =>
      workspaceSlug ? workspaceService.getWorkspaceIntegrations(workspaceSlug as string) : null
  );

  const handleRemoveIntegration = async () => {
    if (!workspaceSlug || !integration || !workspaceIntegrations) return;

    const workspaceIntegrationId = workspaceIntegrations?.find(
      (i) => i.integration === integration.id
    )?.id;

    setDeletingIntegration(true);

    await workspaceService
      .deleteWorkspaceIntegration(workspaceSlug as string, workspaceIntegrationId ?? "")
      .then(() => {
        mutate<IWorkspaceIntegrations[]>(
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
          <Image src={GithubLogo} alt="GithubLogo" />
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
                ? "Activate GitHub integrations on individual projects to sync with specific repositories."
                : "Connect with GitHub with your Plane workspace to sync project issues."
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
          <SecondaryButton onClick={startAuth} outline>
            Add installation
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

export default OAuthPopUp;
