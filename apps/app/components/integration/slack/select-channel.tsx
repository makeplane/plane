import React, { useState, useEffect } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";
// services
import appinstallationsService from "services/app-installations.service";

// ui
import { Loader } from "components/ui";
// hooks
import useToast from "hooks/use-toast";
import useIntegrationPopup from "hooks/use-integration-popup";
// types
import { IWorkspaceIntegration } from "types";
// fetch-keys
import { SLACK_CHANNEL_INFO } from "constants/fetch-keys";

type Props = {
  integration: IWorkspaceIntegration;
};

export const SelectChannel: React.FC<Props> = ({ integration }) => {
  const [deletingProjectSync, setDeletingProjectSync] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { startAuth } = useIntegrationPopup("slackChannel", integration.id);

  const { data: projectIntegration } = useSWR(
    workspaceSlug && projectId && integration.id
      ? SLACK_CHANNEL_INFO(workspaceSlug as string, projectId as string)
      : null,
    () =>
      workspaceSlug && projectId && integration.id
        ? appinstallationsService.getSlackChannelDetail(
            workspaceSlug as string,
            projectId as string,
            integration.id as string
          )
        : null
  );

  useEffect(() => {
    if (projectIntegration?.length > 0) {
      setDeletingProjectSync(true);
    }
    if (projectIntegration?.length === 0) {
      setDeletingProjectSync(false);
    }
  }, [projectIntegration]);

  const handleDelete = async () => {
    if (projectIntegration.length === 0) return;
    mutate(SLACK_CHANNEL_INFO, (prevData: any) => {
      if (!prevData) return;
      return prevData.id !== integration.id;
    }).then(() => setDeletingProjectSync(false));
    appinstallationsService
      .removeSlackChannel(
        workspaceSlug as string,
        projectId as string,
        integration.id as string,
        projectIntegration?.[0]?.id
      )
      .catch((err) => console.log(err));
  };

  const handleAuth = async () => {
    await startAuth();
    setDeletingProjectSync(true);
  };

  return (
    <>
      {projectIntegration ? (
        <button
          type="button"
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            projectIntegration.length > 0 && deletingProjectSync ? "bg-green-500" : "bg-gray-200"
          }`}
          role="switch"
          aria-checked
          onClick={() => {
            deletingProjectSync ? handleDelete() : handleAuth();
          }}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              projectIntegration.length > 0 && deletingProjectSync
                ? "translate-x-5"
                : "translate-x-0"
            }`}
          />
        </button>
      ) : (
        <Loader>
          <Loader.Item height="35px" width="150px" />
        </Loader>
      )}
    </>
  );
};
