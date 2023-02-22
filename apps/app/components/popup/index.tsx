import { useRouter } from "next/router";
import React, { useRef } from "react";

const OAuthPopUp = ({ workspaceSlug, integration }: any) => {
  const popup = useRef<any>();

  const router = useRouter();

  const checkPopup = () => {
    const check = setInterval(() => {
      if (!popup || popup.current.closed || popup.current.closed === undefined) {
        clearInterval(check);
      }
    }, 1000);
  };

  const openPopup = () => {
    const width = 600,
      height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    const url = `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME}/installations/new?state=${workspaceSlug}`;

    return window.open(url, "", `width=${width}, height=${height}, top=${top}, left=${left}`);
  };

  const startAuth = () => {
    popup.current = openPopup();
    checkPopup();
  };

  return (
    <>
      <div>
        <button onClick={startAuth}>{integration.title}</button>
      </div>
    </>
  );
};

export default OAuthPopUp;
