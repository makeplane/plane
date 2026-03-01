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
import { observer } from "mobx-react";
// plane web components
import { useTranslation } from "@plane/i18n";
import { OAuth, PersonalAccessTokenAuth } from "@/components/importers/asana";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";

export const AuthenticationRoot = observer(function AuthenticationRoot() {
  // hooks
  const {
    auth: { currentAuth },
  } = useAsanaImporter();
  const { t } = useTranslation();

  if (currentAuth?.isAuthenticated) return <div>{t("common.authenticated")}</div>;

  return <>{currentAuth?.isOAuthEnabled ? <OAuth /> : <PersonalAccessTokenAuth />}</>;
});
