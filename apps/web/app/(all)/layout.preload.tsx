"use client";

import { useEffect } from "react";
import ReactDOM from "react-dom";

// https://nextjs.org/docs/app/api-reference/functions/generate-metadata#link-relpreload
export const usePreloadResources = () => {
  useEffect(() => {
    const preloadItem = (url: string) => {
      ReactDOM.preload(url, { as: "fetch", crossOrigin: "use-credentials" });
    };

    const urls = [
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/instances/`,
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/`,
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/profile/`,
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/settings/`,
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/workspaces/?v=${Date.now()}`,
    ];

    urls.forEach((url) => preloadItem(url));
  }, []);
};

export const PreloadResources = () => {
  usePreloadResources();
  return null;
};
