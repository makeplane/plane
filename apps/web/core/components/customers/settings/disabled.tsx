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
// plane imports
import { useTranslation } from "@plane/i18n";
// assets
import { EmptyStateCompact } from "@plane/propel/empty-state";

type TCustomerSettingsDisabled = {
  toggleCustomersFeature: () => void;
};
export function CustomerSettingsDisabled(props: TCustomerSettingsDisabled) {
  const { toggleCustomersFeature } = props;
  // hooks
  const { t } = useTranslation();

  return (
    <EmptyStateCompact
      assetKey="customer"
      title={t("settings_empty_state.customers_setting.title")}
      actions={[
        { label: t("settings_empty_state.customers_setting.cta_primary"), onClick: () => toggleCustomersFeature() },
      ]}
      align="start"
      rootClassName="py-20"
    />
  );
}
