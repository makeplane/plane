import React, { useEffect, ReactElement } from "react";
import { useRouter } from "next/router";
// ui
import { LogoSpinner } from "@/components/common";
// types
import { NextPageWithLayout } from "@/lib/types";
// services
import { AppInstallationService } from "@/services/app_installation.service";

// services
const appInstallationService = new AppInstallationService();

const AppPostInstallation: NextPageWithLayout = () => {
  const router = useRouter();
  const { installation_id, state, provider, code } = router.query;

  useEffect(() => {
    if (provider === "github" && state && installation_id) {
      appInstallationService
        .addInstallationApp(state.toString(), provider, { installation_id })
        .then(() => {
          window.opener = null;
          window.open("", "_self");
          window.close();
        })
        .catch((err) => {
          console.log(err);
        });
    } else if (provider === "slack" && state && code) {
      const [workspaceSlug, projectId, integrationId] = state.toString().split(",");

      if (!projectId) {
        const payload = {
          code,
        };
        appInstallationService
          .addInstallationApp(state.toString(), provider, payload)
          .then(() => {
            window.opener = null;
            window.open("", "_self");
            window.close();
          })
          .catch((err) => {
            throw err?.response;
          });
      } else {
        const payload = {
          code,
        };
        appInstallationService
          .addSlackChannel(workspaceSlug, projectId, integrationId, payload)
          .then(() => {
            window.opener = null;
            window.open("", "_self");
            window.close();
          })
          .catch((err) => {
            throw err?.response;
          });
      }
    }
  }, [state, installation_id, provider, code]);

  return (
    <div className="absolute left-0 top-0 z-50 flex h-full w-full flex-col items-center justify-center gap-y-3 bg-custom-background-80">
      <h2 className="text-2xl text-custom-text-100">Installing. Please wait...</h2>
      <LogoSpinner />
    </div>
  );
};

AppPostInstallation.getLayout = function getLayout(page: ReactElement) {
  return <div>{page}</div>;
};

export default AppPostInstallation;
