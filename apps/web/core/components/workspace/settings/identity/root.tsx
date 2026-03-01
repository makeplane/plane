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

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// local components
import { DomainManagementSection } from "./domain-management/section";
import { ProviderSection } from "./provider/section";

type TIdentityRoot = {
  workspaceSlug: string;
};

export const IdentityRoot = observer(function IdentityRoot({ workspaceSlug }: TIdentityRoot) {
  // plane hooks
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Main page header */}
      <div className="flex flex-col gap-1 border-b border-subtle pb-4">
        <h5 className="text-h5-medium text-primary">{t("sso.header")}</h5>
        <div className="text-body-xs-regular text-tertiary">{t("sso.description")}</div>
      </div>
      {/* Domain Management Section */}
      <DomainManagementSection workspaceSlug={workspaceSlug} />
      {/* Single sign-on section */}
      <ProviderSection workspaceSlug={workspaceSlug} />
    </div>
  );
});
