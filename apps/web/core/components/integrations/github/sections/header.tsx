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

import { useTheme } from "next-themes";
import { useTranslation } from "@plane/i18n";
// assets
import GithubDarkLogo from "@/app/assets/services/github-dark.svg?url";
import GithubLightLogo from "@/app/assets/services/github-light.svg?url";

export function GithubHeader() {
  // hooks
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const githubLogo = resolvedTheme === "dark" ? GithubLightLogo : GithubDarkLogo;
  return (
    <div className="flex-shrink-0 relative flex items-center gap-4 rounded-sm bg-layer-1 p-4">
      <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
        <img src={githubLogo} alt="GitHub Logo" className="w-full h-full object-cover" />
      </div>
      <div>
        <div className="text-body-sm-medium">GitHub</div>
        <div className="text-body-xs-regular text-secondary">{t("github_integration.description")}</div>
      </div>
    </div>
  );
}
