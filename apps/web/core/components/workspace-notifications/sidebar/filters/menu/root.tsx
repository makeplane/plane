/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
// workspaces imports
import type { ENotificationFilterType } from "@workspaces/constants";
import { FILTER_TYPE_OPTIONS } from "@workspaces/constants";
import { useTranslation } from "@workspaces/i18n";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { PopoverMenu } from "@workspaces/ui";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { NotificationFilterOptionItem } from "./menu-option-item";
import { IconButton } from "@workspaces/propel/icon-button";

export const NotificationFilter = observer(function NotificationFilter() {
  // hooks
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  const translatedFilterTypeOptions = FILTER_TYPE_OPTIONS.map((filter) => ({
    ...filter,
    label: t(filter.i18n_label),
  }));

  return (
    <PopoverMenu
      data={translatedFilterTypeOptions}
      button={
        <Tooltip label={t("notification.options.filters")} side="bottom" disabled={isMobile}>
          <IconButton size="base" variant="ghost" icon={ListFilter} />
        </Tooltip>
      }
      keyExtractor={(item: { label: string; value: ENotificationFilterType }) => item.value}
      render={(item) => <NotificationFilterOptionItem {...item} />}
    />
  );
});
