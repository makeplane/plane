import React, { useEffect } from "react";
import appinstallationsService from "services/appinstallations.service";

interface IGithuPostInstallationProps {
  installation_id: string;
  setup_action: string;
  state: string;
  provider: string;
}

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
  return <>Loading...</>;
};

export async function getServerSideProps(context: any) {
  console.log(context.query);
  return {
    props: context.query,
  };
}

export default AppPostInstallation;
