/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { Icon as PropelIcon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { MoreVerticalOutline } from "@makeplane/propel/icons";
import { getRenderableItems, resolveItemVariant } from "@plane/blocks/context-menu";
import type { TContextMenuItem } from "@plane/blocks/context-menu";
import { useTranslation } from "@plane/i18n";
import { calculateTimeAgo, getIconForLink } from "@plane/utils";

export type TLinkItemBlockProps = {
  title: string;
  url: string;
  createdAt?: Date | string;
  menuItems?: TContextMenuItem[];
  onClick?: () => void;
};

export function LinkItemBlock(props: TLinkItemBlockProps) {
  // props
  const { title, url, createdAt, menuItems, onClick } = props;
  // plane hooks
  const { t } = useTranslation();
  // icons
  const Icon = getIconForLink(url);
  return (
    <div className="group flex h-[56px] w-[230px] items-center gap-4 rounded-md border-[0.5px] border-subtle bg-surface-1 pr-4">
      {/* the card body is its own button so the menu trigger is not nested inside a clickable ancestor */}
      <button
        type="button"
        onClick={onClick}
        className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-4 pl-4 text-left"
      >
        <span className="grid size-8 flex-shrink-0 place-items-center rounded-sm bg-surface-2 p-2">
          <Icon className="size-4 stroke-2 text-tertiary group-hover:text-primary" />
        </span>
        <span className="block flex-1 truncate">
          <span className="block truncate text-13 font-medium">{title}</span>
          {createdAt && (
            <span className="block text-11 font-medium text-placeholder">{calculateTimeAgo(createdAt)}</span>
          )}
        </span>
      </button>
      {menuItems && (
        <div className="hidden group-focus-within:block group-hover:block has-[[data-popup-open]]:block">
          <Menu>
            <MenuTrigger
              render={
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label={t("aria_labels.common.more_actions")}
                  icon={<PropelIcon icon={MoreVerticalOutline} />}
                />
              }
            />
            <MenuContent side="bottom" align="end">
              {getRenderableItems(menuItems).map((item) => (
                <MenuItem
                  key={item.key}
                  variant={resolveItemVariant(item)}
                  icon={item.icon ? <PropelIcon icon={item.icon} /> : undefined}
                  label={item.title ?? ""}
                  description={item.description}
                  disabled={item.disabled}
                  onClick={() => item.action()}
                />
              ))}
            </MenuContent>
          </Menu>
        </div>
      )}
    </div>
  );
}
