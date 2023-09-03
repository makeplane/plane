import React, { useEffect } from "react";

// services
import appinstallationsService from "services/app-installations.service";

import useToast from "hooks/use-toast";

// components
import { Spinner } from "components/ui";

import { useRouter } from "next/router";

interface IGithuPostInstallationProps {
  installation_id: string;
  setup_action: string;
  state: string;
  provider: string;
  code: string;
}

// TODO:Change getServerSideProps to router.query
const AppPostInstallation = ({
  installation_id,
  setup_action,
  state,
  provider,
  code,
}: IGithuPostInstallationProps) => {
  const { setToastAlert } = useToast();

  useEffect(() => {
    if (provider === "github" && state && installation_id) {
      appinstallationsService
        .addInstallationApp(state, provider, { installation_id })
        .then(() => {
          window.opener = null;
          window.open("", "_self");
          window.close();
        })
        .catch((err) => {
          console.log(err);
        });
    } else if (provider === "slack" && state && code) {
      appinstallationsService
        .getSlackAuthDetails(code)
        .then((res) => {
          const [workspaceSlug, projectId, integrationId] = state.split(",");

          if (!projectId) {
            const payload = {
              metadata: {
                ...res,
              },
            };

            appinstallationsService
              .addInstallationApp(state, provider, payload)
              .then((r) => {
                window.opener = null;
                window.open("", "_self");
                window.close();
              })
              .catch((err) => {
                throw err?.response;
              });
          } else {
            const payload = {
              access_token: res.access_token,
              bot_user_id: res.bot_user_id,
              webhook_url: res.incoming_webhook.url,
              data: res,
              team_id: res.team.id,
              team_name: res.team.name,
              scopes: res.scope,
            };
            appinstallationsService
              .addSlackChannel(workspaceSlug, projectId, integrationId, payload)
              .then((r) => {
                window.opener = null;
                window.open("", "_self");
                window.close();
              })
              .catch((err) => {
                throw err.response;
              });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [state, installation_id, provider, code]);

  return (
    <div className="absolute top-0 left-0 z-50 flex h-full w-full flex-col items-center justify-center gap-y-3 bg-custom-background-80">
      <h2 className="text-2xl text-custom-text-100">Installing. Please wait...</h2>
      <Spinner />
    </div>
  );
};

export async function getServerSideProps(context: any) {
  return {
    props: context.query,
  };
}

export default AppPostInstallation;
