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

import { useState } from "react";
import { Ellipsis } from "lucide-react";
// plane imports
import { FlagIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { Menu } from "@plane/propel/menu";
import { cn } from "@plane/utils";
// components
import { ReportPageModal } from "@/plane-web/components/pages/report-page-modal";

export type PagesQuickActionsProps = { anchor: string };

export const PagesQuickActions = function PagesQuickActions(props: PagesQuickActionsProps) {
  const { anchor } = props;

  const [reportPageModal, setReportPageModal] = useState(false);

  const MENU_ITEMS = [
    {
      key: "report-page",
      title: "Report page",
      icon: FlagIcon,
      action: () => setReportPageModal(true),
      className: "text-danger-secondary",
    },
  ];

  return (
    <>
      <ReportPageModal isOpen={reportPageModal} onClose={() => setReportPageModal(false)} anchor={anchor} />

      <Menu
        maxHeight="lg"
        customButton={<IconButton size="lg" variant="secondary" icon={Ellipsis} />}
        menuItemsClassName="z-[14]"
        closeOnSelect
        optionsClassName="divide-y divide-subtle p-0"
      >
        {MENU_ITEMS.map((item) => (
          <Menu.MenuItem
            key={item.key}
            onClick={item.action}
            className={cn("flex items-center gap-2 text-body-sm-regular px-2 py-2.5 rounded-b-none", item.className)}
          >
            {item.icon && <item.icon className="size-4 shrink-0" />}
            <span>{item.title}</span>
          </Menu.MenuItem>
        ))}
      </Menu>
    </>
  );
};
