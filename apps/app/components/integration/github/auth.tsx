import { FC, useRef, useState } from "react";

// ui
import { PrimaryButton } from "components/ui";

type Props = {
  workspaceSlug: string | undefined;
  workspaceIntegration: any;
};

export const GithubAuth: FC<Props> = ({ workspaceSlug, workspaceIntegration }) => {
  const popup = useRef<any>();
  const [authLoader, setAuthLoader] = useState(false);

  const checkPopup = () => {
    const check = setInterval(() => {
      if (!popup || popup.current.closed || popup.current.closed === undefined) {
        clearInterval(check);
        setAuthLoader(false);
      }
    }, 2000);
  };

  const openPopup = () => {
    const width = 600,
      height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    const url = `https://github.com/apps/${
      process.env.NEXT_PUBLIC_GITHUB_APP_NAME
    }/installations/new?state=${workspaceSlug as string}`;

    return window.open(url, "", `width=${width}, height=${height}, top=${top}, left=${left}`);
  };

  const startAuth = () => {
    popup.current = openPopup();
    checkPopup();
    setAuthLoader(true);
  };

  return (
    <div>
      {workspaceIntegration && workspaceIntegration?.id ? (
        <PrimaryButton disabled>Successfully Connected</PrimaryButton>
      ) : (
        <PrimaryButton onClick={startAuth} loading={authLoader}>
          {authLoader ? "Connecting..." : "Connect"}
        </PrimaryButton>
      )}
    </div>
  );
};
