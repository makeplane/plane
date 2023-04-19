import { useRef, useState } from "react";

import { useRouter } from "next/router";

const useIntegrationPopup = (provider: string | undefined) => {
  const [authLoader, setAuthLoader] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const providerUrls: { [key: string]: string } = {
    github: `https://github.com/apps/${
      process.env.NEXT_PUBLIC_GITHUB_APP_NAME
    }/installations/new?state=${workspaceSlug as string}`,
    slack: "",
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
