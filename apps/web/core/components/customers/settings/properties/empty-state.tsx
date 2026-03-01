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

import { v4 } from "uuid";

import { PlusIcon, BuildingsIcon } from "@plane/propel/icons";
// plane i18n
import { useTranslation } from "@plane/i18n";
// plane icons
import { Button } from "@plane/propel/button";
// plane types
import type { TCreationListModes } from "@plane/types";
// plane ui
// plane web components
import { defaultCustomProperty } from "@/components/customers/settings";
import type { TIssuePropertyCreateList } from "@/components/work-item-types/properties/root";

type TCustomerPropertiesEmptyStateProps = {
  handleCustomerPropertiesCreate: (mode: TCreationListModes, value: TIssuePropertyCreateList) => void;
};

export function CustomerPropertiesEmptyState(props: TCustomerPropertiesEmptyStateProps) {
  const { handleCustomerPropertiesCreate } = props;
  const { t } = useTranslation();
  return (
    <div className="p-8 relative flex justify-center items-center bg-surface-1 rounded-lg border border-subtle mx-4">
      <div className="flex flex-col items-center space-y-1">
        <div className="shrink-0 grid place-items-center rounded-lg bg-layer-1 p-3">
          <BuildingsIcon className="h-14 w-14 text-placeholder" strokeWidth="1.5" />
        </div>
        <div className="text-primary font-medium text-14">{t("customers.properties.empty_state.title")}</div>
        <div className="text-13 text-placeholder pb-4 max-w-[60%] text-center">
          {t("customers.properties.empty_state.description")}
        </div>
        <Button
          variant="secondary"
          className="rounded-md"
          onClick={() => {
            handleCustomerPropertiesCreate("add", { key: v4(), ...defaultCustomProperty });
          }}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          {t("customers.properties.add.primary_button")}
        </Button>
      </div>
    </div>
  );
}
