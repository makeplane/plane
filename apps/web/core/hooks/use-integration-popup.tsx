/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

const useIntegrationPopup = ({
  provider,
  stateParams,
  github_app_name,
  slack_client_id,
}: {
  provider: string | undefined;
  stateParams?: string;
  github_app_name?: string;
  slack_client_id?: string;
}) => {
  const [authLoader, setAuthLoader] = useState(false);

  const { workspaceSlug, projectId } = useParams();

  const providerUrls: { [key: string]: string } = {
    github: `https://github.com/apps/${github_app_name}/installations/new?state=${workspaceSlug?.toString()}`,
    slack: `https://slack.com/oauth/v2/authorize?scope=chat:write,im:history,im:write,links:read,links:write,users:read,users:read.email&amp;user_scope=&amp;&client_id=${slack_client_id}&state=${workspaceSlug?.toString()}`,
    slackChannel: `https://slack.com/oauth/v2/authorize?scope=incoming-webhook&client_id=${slack_client_id}&state=${workspaceSlug?.toString()},${projectId?.toString()}${
      stateParams ? "," + stateParams : ""
    }`,
  };

  const popup = useRef<Window | null>(null);
  const popupCheckIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // release the polling interval if the component unmounts mid-auth
  useEffect(
    () => () => {
      if (popupCheckIntervalRef.current) clearInterval(popupCheckIntervalRef.current);
    },
    []
  );

  const checkPopup = () => {
    popupCheckIntervalRef.current = setInterval(() => {
      if (!popup.current || popup.current.closed) {
        clearInterval(popupCheckIntervalRef.current);
        setAuthLoader(false);
      }
    }, 1000);
  };

  const openPopup = (): Window | null => {
    if (!provider) return null;

    const width = 600,
      height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    const url = providerUrls[provider];

    return window.open(url, "", `width=${width}, height=${height}, top=${top}, left=${left}`);
  };

  const startAuth = () => {
    popup.current = openPopup();
    if (!popup.current) return;
    checkPopup();
    setAuthLoader(true);
  };

  return {
    startAuth,
    isConnecting: authLoader,
  };
};

export default useIntegrationPopup;
