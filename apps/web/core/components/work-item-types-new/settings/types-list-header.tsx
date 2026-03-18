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
import { Badge } from "@plane/propel/badge";
import { Menu } from "@plane/propel/menu";
import { IconButton } from "@plane/propel/icon-button";
import { ArrowUpWideNarrow } from "lucide-react";
import { Input } from "@plane/propel/input";
import { SearchIcon, FilterIcon } from "@plane/propel/icons";

const SORT_OPTIONS: { key: string; labelKey: string }[] = [
  {
    key: "name",
    labelKey: "common.name",
  },
  {
    key: "project_count",
    labelKey: "work_item_types.settings.types.sort_options.project_count",
  },
];

const FILTER_OPTIONS: { key: string; labelKey: string }[] = [
  {
    key: "active",
    labelKey: "work_item_types.settings.types.filter_options.show_active",
  },
  {
    key: "inactive",
    labelKey: "work_item_types.settings.types.filter_options.show_inactive",
  },
];

type Props = {
  count: number;
  actionButton?: React.ReactNode;
};

export const WorkItemTypesSettingsListHeader = observer(function WorkItemTypesSettingsListHeader(props: Props) {
  // props
  const { actionButton, count } = props;
  // hooks
  const { t } = useTranslation();
  return (
    <div className="flex justify-between">
      <div className="flex items-center gap-2">
        <h6 className="text-h6-medium">{t("work_item_types.settings.types.title")}</h6>
        <Badge variant={"brand"}>{count}</Badge>
      </div>
      {actionButton}
      {/* <div className="flex items-center gap-2">
        <Input
          inputSize="xs"
          placeholder={t("search")}
          value={""}
          onChange={(e) => {}}
          prependIcon={<SearchIcon className="size-4 text-tertiary" />}
        />
        <Menu
          customButton={
            <div className="relative">
              <IconButton icon={FilterIcon} size="base" variant={"secondary"} />
              <div className="size-2 bg-accent-primary rounded-full absolute -top-1 -right-1 " />
            </div>
          }
        >
          {FILTER_OPTIONS.map((option) => (
            <Menu.MenuItem key={option.key}>{t(option.labelKey)}</Menu.MenuItem>
          ))}
        </Menu>
        <Menu
          customButton={
            <div className="relative">
              <IconButton icon={ArrowUpWideNarrow} size="base" variant={"secondary"} />
              <div className="size-2 bg-accent-primary rounded-full absolute -top-1 -right-1 " />
            </div>
          }
        >
          {SORT_OPTIONS.map((option) => (
            <Menu.MenuItem key={option.key}>{t(option.labelKey)}</Menu.MenuItem>
          ))}
          <hr className="my-2 border-subtle" />
          {["asc", "desc"].map((order) => (
            <Menu.MenuItem key={order}>{t("common.sort.asc")}</Menu.MenuItem>
          ))}
        </Menu>
        {actionButton}
      </div> */}
    </div>
  );
});
