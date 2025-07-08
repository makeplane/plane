"use client";

import { useParams, usePathname } from "next/navigation";

/**
 * Custom hook to detect different workspace paths
 * @returns Object containing boolean flags for different workspace paths
 */
export const useWorkspacePaths = () => {
  const { workspaceSlug } = useParams();
  const pathname = usePathname();

  const isSettingsPath = pathname.includes(`/${workspaceSlug}/settings`);
  const isWikiPath = pathname.includes(`/${workspaceSlug}/pages`);
  const isAiPath = pathname.includes(`/${workspaceSlug}/pi-chat`);
  const isProjectsPath = pathname.includes(`/${workspaceSlug}/`) && !isWikiPath && !isAiPath && !isSettingsPath;

  return {
    isSettingsPath,
    isWikiPath,
    isAiPath,
    isProjectsPath,
  };
};
