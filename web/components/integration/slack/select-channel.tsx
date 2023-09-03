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
import { IWorkspaceIntegration, ISlackIntegration } from "types";
// fetch-keys
import { SLACK_CHANNEL_INFO } from "constants/fetch-keys";

type Props = {
  integration: IWorkspaceIntegration;
};

export const SelectChannel: React.FC<Props> = ({ integration }) => {
  const [slackChannelAvailabilityToggle, setSlackChannelAvailabilityToggle] =
    useState<boolean>(false);
  const [slackChannel, setSlackChannel] = useState<ISlackIntegration | null>(null);

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
    if (projectId && projectIntegration && projectIntegration.length > 0) {
      const projectSlackIntegrationCheck: ISlackIntegration | undefined = projectIntegration.find(
        (_slack: ISlackIntegration) => _slack.project === projectId
      );
      if (projectSlackIntegrationCheck) {
        setSlackChannel(() => projectSlackIntegrationCheck);
        setSlackChannelAvailabilityToggle(true);
      }
    }
  }, [projectIntegration, projectId]);

  const handleDelete = async () => {
    if (projectIntegration.length === 0) return;
    mutate(SLACK_CHANNEL_INFO, (prevData: any) => {
      if (!prevData) return;
      return prevData.id !== integration.id;
    }).then(() => {
      setSlackChannelAvailabilityToggle(false);
      setSlackChannel(null);
    });
    appinstallationsService
      .removeSlackChannel(
        workspaceSlug as string,
        projectId as string,
        integration.id as string,
        slackChannel?.id
      )
      .catch((err) => console.log(err));
  };

  const handleAuth = async () => {
    await startAuth();
  };

  return (
    <>
      {projectIntegration ? (
        <button
          type="button"
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            slackChannelAvailabilityToggle ? "bg-green-500" : "bg-gray-200"
          }`}
          role="switch"
          aria-checked
          onClick={() => {
            slackChannelAvailabilityToggle ? handleDelete() : handleAuth();
          }}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              slackChannelAvailabilityToggle ? "translate-x-5" : "translate-x-0"
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
