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
import React from "react";
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/propel/button";
import { LayersIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
import { SectionEmptyState } from "@/components/common/layout/main/common/empty-state";

type TProps = {
  linkWorkItem: () => void;
};
export function WorkItemEmptyState(props: TProps) {
  const { linkWorkItem } = props;
  // i18n
  const { t } = useTranslation();

  return (
    <SectionEmptyState
      heading={t("customers.linked_work_items.empty_state.list.title")}
      subHeading={t("customers.linked_work_items.empty_state.list.description")}
      icon={<LayersIcon className="size-5" />}
      actionElement={
        <span
          onClick={linkWorkItem}
          className={cn(getButtonStyling("secondary", "base"), "font-medium px-2 py-1 cursor-pointer")}
        >
          {t("customers.linked_work_items.empty_state.list.button")}
        </span>
      }
    />
  );
}
