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

import React, { useState } from "react";
import { AlignLeft, Hash, CircleChevronDown } from "lucide-react";
// plane i18n
import { useTranslation } from "@plane/i18n";
import { ChevronRightIcon } from "@plane/propel/icons";
// plane ui
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
// helpers
import { cn } from "@plane/utils";

const DEFAULT_PROPERTIES_LIST = [
  {
    i18n_title: "customers.properties.default.customer_name.name",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.description.name",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.email.name",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.website_url.name",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.employees.name",
    icon: Hash,
  },
  {
    i18n_title: "customers.properties.default.domain.name",
    icon: AlignLeft,
  },
  {
    i18n_title: "customers.properties.default.stage.name",
    icon: CircleChevronDown,
  },
  {
    i18n_title: "customers.properties.default.contract_status.name",
    icon: CircleChevronDown,
  },
  {
    i18n_title: "customers.properties.default.revenue.name",
    icon: Hash,
  },
];

export function CustomerDefaultProperties() {
  // states
  const [isOpen, setIsOpen] = useState(true);
  // hooks
  const { t } = useTranslation();
  return (
    <div className="group/issue-type bg-layer-1 rounded-md px-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className={cn("flex w-full py-3 gap-2 items-center justify-between")}>
          <div className="flex w-full gap-2 cursor-pointer items-center">
            <div className="flex-shrink-0">
              <ChevronRightIcon
                className={cn("flex-shrink-0 size-4 transition-all text-tertiary", {
                  "rotate-90": isOpen,
                })}
              />
            </div>
            <div className="text-left">
              <h3 className="text-14 font-medium">{t("customers.properties.default.title")}</h3>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-wrap gap-2 pb-4">
            {DEFAULT_PROPERTIES_LIST.map((property) => (
              <div
                key={property.i18n_title}
                className="flex items-center gap-2 bg-surface-1 border border-subtle-1 rounded-md p-2 cursor-default"
              >
                <property.icon className="size-4" />
                <p className="text-13 text-tertiary">{t(property.i18n_title)}</p>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
