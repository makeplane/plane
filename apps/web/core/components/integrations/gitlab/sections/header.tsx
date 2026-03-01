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

import type { FC } from "react";
import { useTranslation } from "@plane/i18n";
// assets
import GitlabLogo from "@/app/assets/services/gitlab.svg?url";

interface IGitlabHeaderProps {
  isEnterprise: boolean;
}

export function GitlabHeader({ isEnterprise }: IGitlabHeaderProps) {
  // hooks
  const { t } = useTranslation();

  return (
    <div className="flex-shrink-0 relative flex items-center gap-4 rounded-sm bg-layer-1 p-4">
      <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
        <img src={GitlabLogo} alt="Gitlab Logo" className="w-full h-full object-cover" />
      </div>
      <div>
        <div className="text-body-sm-medium">
          {isEnterprise ? t("gitlab_enterprise_integration.name") : t("gitlab_integration.name")}
        </div>
        <div className="text-body-xs-regular text-secondary">
          {isEnterprise ? t("gitlab_enterprise_integration.description") : t("gitlab_integration.description")}
        </div>
      </div>
    </div>
  );
}
