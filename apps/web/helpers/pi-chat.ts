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

export const hideFloatingBot = () => {
  const floatingBot = document.getElementById("floating-bot");
  if (floatingBot) {
    floatingBot.style.display = "none";
  }
};

export const showFloatingBot = () => {
  const floatingBot = document.getElementById("floating-bot");
  if (floatingBot) {
    floatingBot.style.display = "flex";
  }
};

export const isPiAllowed = (
  pathname: string,
  workspaceSlug: string,
  projectId: string | undefined,
  workItem: string | undefined
): boolean => {
  // restricted routes
  if (pathname.includes(`/${workspaceSlug}/ai-chat/`)) return false;
  if (pathname.includes(`/${workspaceSlug}/settings/`)) return false;
  // allowed routes
  if (pathname.includes(`/${workspaceSlug}/initiatives/`)) return true;
  if (pathname.includes(`/${workspaceSlug}/teamspaces/`)) return true;
  if (pathname.includes(`/${workspaceSlug}/wiki/`)) return true;
  // default to false
  if (!projectId && !workItem) return false;
  return true;
};
