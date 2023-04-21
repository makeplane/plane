import { useRef, useState } from "react";

import { useRouter } from "next/router";

const useIntegrationPopup = (provider: string | undefined, stateParams?: string) => {
  const [authLoader, setAuthLoader] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const providerUrls: { [key: string]: string } = {
    github: `https://github.com/apps/${
      process.env.NEXT_PUBLIC_GITHUB_APP_NAME
    }/installations/new?state=${workspaceSlug?.toString()}`,
    slack: `https://slack.com/oauth/v2/authorize?scope=chat%3Awrite%2Cim%3Ahistory%2Cim%3Awrite%2Clinks%3Aread%2Clinks%3Awrite%2Cusers%3Aread%2Cusers%3Aread.email&amp;user_scope=&amp;&client_id=${
      process.env.NEXT_PUBLIC_SLACK_CLIENT_ID
    }&state=${workspaceSlug?.toString()}`,
    slackChannel: `https://slack.com/oauth/v2/authorize?scope=incoming-webhook&client_id=${
      process.env.NEXT_PUBLIC_SLACK_CLIENT_ID
    }&state=${workspaceSlug?.toString()},${projectId?.toString()}${
      stateParams ? "," + stateParams : ""
    }`,
  };
  const popup = useRef<any>();

  const checkPopup = () => {
    const check = setInterval(() => {
      if (!popup || popup.current.closed || popup.current.closed === undefined) {
        clearInterval(check);
        setAuthLoader(false);
      }
    }, 1000);
  };

  const openPopup = () => {
    if (!provider) return;

    const width = 600,
      height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    const url = providerUrls[provider];

    return window.open(url, "", `width=${width}, height=${height}, top=${top}, left=${left}`);
  };

  const startAuth = () => {
    popup.current = openPopup();
    checkPopup();
    setAuthLoader(true);
  };

  return {
    startAuth,
    isConnecting: authLoader,
  };
};

export default useIntegrationPopup;
