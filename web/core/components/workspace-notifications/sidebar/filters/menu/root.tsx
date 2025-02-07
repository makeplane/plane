"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
// plane imports
import { ENotificationFilterType, FILTER_TYPE_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PopoverMenu, Tooltip } from "@plane/ui";
// components
import { NotificationFilterOptionItem } from "@/components/workspace-notifications";
// constants
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

export const NotificationFilter: FC = observer(() => {
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
        <Tooltip tooltipContent={t("notification.options.filters")} isMobile={isMobile} position="bottom">
          <div className="flex-shrink-0 w-5 h-5 flex justify-center items-center overflow-hidden cursor-pointer transition-all hover:bg-custom-background-80 rounded-sm outline-none">
            <ListFilter className="h-3 w-3" />
          </div>
        </Tooltip>
      }
      keyExtractor={(item: { label: string; value: ENotificationFilterType }) => item.value}
      render={(item) => <NotificationFilterOptionItem {...item} />}
    />
  );
});
