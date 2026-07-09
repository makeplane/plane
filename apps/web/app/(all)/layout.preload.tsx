"use client";

import { useEffect } from "react";
import ReactDOM from "react-dom";

// https://nextjs.org/docs/app/api-reference/functions/generate-metadata#link-relpreload
export const usePreloadResources = () => {
  useEffect(() => {
    const preloadItem = (url: string) => {
      ReactDOM.preload(url, { as: "fetch", crossOrigin: "use-credentials" });
    };

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
    const urls = [
      `${apiBaseUrl}/api/instances/`,
      `${apiBaseUrl}/api/users/me/`,
      `${apiBaseUrl}/api/users/me/profile/`,
      `${apiBaseUrl}/api/users/me/settings/`,
      `${apiBaseUrl}/api/users/me/workspaces/?v=${Date.now()}`,
    ];

    urls.forEach((url) => preloadItem(url));
  }, []);
};

export const PreloadResources = () => {
  usePreloadResources();
  return null;
};
