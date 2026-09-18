/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { FilterOutline } from "@makeplane/propel/icons";
// plane imports
import type { ENotificationFilterType } from "@plane/constants";
import { FILTER_TYPE_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { PopoverMenu } from "@plane/ui";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { NotificationFilterOptionItem } from "./menu-option-item";
import { getIconButtonStyling } from "@plane/propel/icon-button";

export const NotificationFilter = observer(function NotificationFilter() {
  // hooks
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  const translatedFilterTypeOptions = FILTER_TYPE_OPTIONS.map((filter) =>
    Object.assign({}, filter, { label: t(filter.i18n_label) })
  );

  return (
    <PopoverMenu
      ariaLabel={t("notification.options.filters")}
      data={translatedFilterTypeOptions}
      button={
        <Tooltip label={t("notification.options.filters")} side="bottom" disabled={isMobile}>
          <span className={getIconButtonStyling("ghost", "base")}>
            <FilterOutline className="size-4" aria-hidden="true" />
          </span>
        </Tooltip>
      }
      keyExtractor={(item: { label: string; value: ENotificationFilterType }) => item.value}
      render={(item) => <NotificationFilterOptionItem {...item} />}
    />
  );
});
