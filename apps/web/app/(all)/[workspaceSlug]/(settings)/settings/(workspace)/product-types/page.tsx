/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { ProductTypesSettingsRoot } from "@/components/products/types-settings-root";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { ProductTypesSettingsHeader } from "./header";

function ProductTypesSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (workspaceUserInfo && !isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  return (
    <SettingsContentWrapper header={<ProductTypesSettingsHeader />} hugging>
      <PageHead title={currentWorkspace?.name ? `${currentWorkspace.name} - ${t("product.types")}` : undefined} />
      <ProductTypesSettingsRoot workspaceSlug={workspaceSlug} />
    </SettingsContentWrapper>
  );
}

export default observer(ProductTypesSettingsPage);
