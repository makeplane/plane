import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication } from "hooks/store";
import useIntegrationPopup from "hooks/use-integration-popup";
// services
import { AppInstallationService } from "services/app_installation.service";
// ui
import { Loader } from "@plane/ui";
// types
import { IWorkspaceIntegration, ISlackIntegration } from "@plane/types";
// fetch-keys
import { SLACK_CHANNEL_INFO } from "constants/fetch-keys";

type Props = {
  integration: IWorkspaceIntegration;
};

const appInstallationService = new AppInstallationService();

export const SelectChannel: React.FC<Props> = observer(({ integration }) => {
  // store hooks
  const {
    config: { envConfig },
  } = useApplication();
  // states
  const [slackChannelAvailabilityToggle, setSlackChannelAvailabilityToggle] = useState<boolean>(false);
  const [slackChannel, setSlackChannel] = useState<ISlackIntegration | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { startAuth } = useIntegrationPopup({
    provider: "slackChannel",
    stateParams: integration.id,
    github_app_name: envConfig?.github_client_id || "",
    slack_client_id: envConfig?.slack_client_id || "",
  });

  const { data: projectIntegration } = useSWR(
    workspaceSlug && projectId && integration.id
      ? SLACK_CHANNEL_INFO(workspaceSlug as string, projectId as string)
      : null,
    () =>
      workspaceSlug && projectId && integration.id
        ? appInstallationService.getSlackChannelDetail(
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
    if (!workspaceSlug || !projectId) return;
    if (projectIntegration.length === 0) return;
    mutate(SLACK_CHANNEL_INFO(workspaceSlug?.toString(), projectId?.toString()), (prevData: any) => {
      if (!prevData) return;
      return prevData.id !== integration.id;
    }).then(() => {
      setSlackChannelAvailabilityToggle(false);
      setSlackChannel(null);
    });
    appInstallationService
      .removeSlackChannel(workspaceSlug as string, projectId as string, integration.id as string, slackChannel?.id)
      .catch((err) => console.error(err));
  };

  const handleAuth = async () => {
    await startAuth();
  };

  return (
    <>
      {projectIntegration ? (
        <button
          type="button"
          className={`relative inline-flex h-4 w-6 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-700 transition-colors duration-200 ease-in-out focus:outline-none`}
          role="switch"
          aria-checked
          onClick={() => {
            slackChannelAvailabilityToggle ? handleDelete() : handleAuth();
          }}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-2 w-2 transform self-center rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              slackChannelAvailabilityToggle ? "translate-x-3" : "translate-x-0"
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
});
