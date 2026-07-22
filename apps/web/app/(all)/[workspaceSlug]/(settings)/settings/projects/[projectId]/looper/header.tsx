/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Breadcrumbs } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SettingsPageHeader } from "@/components/settings/page-header";
import { PROJECT_SETTINGS_ICONS } from "@/components/settings/project/sidebar/item-icon";

export const LooperProjectSettingsHeader = observer(function LooperProjectSettingsHeader() {
  const Icon = PROJECT_SETTINGS_ICONS.looper;

  return (
    <SettingsPageHeader
      leftItem={
        <Breadcrumbs>
          <Breadcrumbs.Item
            component={<BreadcrumbLink label="Looper" icon={<Icon className="size-4 text-tertiary" />} />}
          />
        </Breadcrumbs>
      }
    />
  );
});
