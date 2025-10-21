"use client";

import { useEffect } from "react";

// https://nextjs.org/docs/app/api-reference/functions/generate-metadata#link-relpreload
export const usePreloadResources = () => {
  useEffect(() => {
    const preloadItem = (url: string) => {
      try {
        const link = document.createElement("link");
        link.rel = "preload";
        // as="fetch" isn't fully typed across all TS DOM lib versions, so set via attribute
        link.setAttribute("as", "fetch");
        link.href = url;
        link.crossOrigin = "use-credentials" as any;
        document.head.appendChild(link);
      } catch (e) {
        // no-op fallback
      }
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
