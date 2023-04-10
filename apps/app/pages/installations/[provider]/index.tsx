import React, { useEffect } from "react";

// services
import appinstallationsService from "services/app-installations.service";
// components
import { Spinner } from "components/ui";

interface IGithuPostInstallationProps {
  installation_id: string;
  setup_action: string;
  state: string;
  provider: string;
}

// TODO:Change getServerSideProps to router.query
const AppPostInstallation = ({
  installation_id,
  setup_action,
  state,
  provider,
}: IGithuPostInstallationProps) => {
  useEffect(() => {
    if (state && installation_id) {
      appinstallationsService
        .addGithubApp(state, provider, { installation_id })
        .then((res) => {
          window.opener = null;
          window.open("", "_self");
          window.close();
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [state, installation_id, provider]);

  return (
    <div className="absolute top-0 left-0 z-50 flex h-full w-full flex-col items-center justify-center gap-y-3 bg-brand-surface-2">
      <h2 className="text-2xl text-brand-base">Installing. Please wait...</h2>
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
