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

import { AlertTriangle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Banner } from "@plane/propel/banner";

export function InstanceTokensDisabledBanner() {
  const { t } = useTranslation();
  return (
    <Banner
      variant="warning"
      title={t("workspace_settings.settings.api_tokens.instance_disabled.title")}
      description={t("workspace_settings.settings.api_tokens.instance_disabled.description")}
      icon={<AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-primary" />}
      className="my-4 rounded-lg border border-warning-subtle p-3"
    />
  );
}
