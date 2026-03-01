/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useParams, usePathname } from "next/navigation";

/**
 * Custom hook to detect different workspace paths
 * @returns Object containing boolean flags for different workspace paths
 */
export const useWorkspacePaths = () => {
  const { workspaceSlug } = useParams();
  const pathname = usePathname();

  const isSettingsPath = pathname.includes(`/${workspaceSlug}/settings`);
  const isWikiPath = pathname.includes(`/${workspaceSlug}/wiki`);
  const isAiPath = pathname.includes(`/${workspaceSlug}/ai-chat`);
  const isProjectsPath = pathname.includes(`/${workspaceSlug}/`) && !isWikiPath && !isAiPath && !isSettingsPath;
  const isNotificationsPath = pathname.includes(`/${workspaceSlug}/notifications`);

  return {
    isSettingsPath,
    isWikiPath,
    isAiPath,
    isProjectsPath,
    isNotificationsPath,
  };
};
