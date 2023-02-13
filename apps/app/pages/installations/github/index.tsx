import React, { useEffect } from "react";
import appinstallationsService from "services/appinstallations.service";

interface IGithuPostInstallationProps {
  installation_id: string;
  setup_action: string;
  state: string;
}

const AppPostInstallation = ({
  installation_id,
  setup_action,
  state,
}: IGithuPostInstallationProps) => {
  useEffect(() => {
    if (state && installation_id) {
      appinstallationsService
        .addGithubApp(state, installation_id)
        .then((res) => {
          window.opener = null;
          window.open("", "_self");
          window.close();
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [state, installation_id]);
  return <>Loading...</>;
};

export async function getServerSideProps(context: any) {
  return {
    props: context.query,
  };
}

export default AppPostInstallation;
