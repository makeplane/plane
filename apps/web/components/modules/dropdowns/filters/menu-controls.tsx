/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createContext, useContext } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@makeplane/propel/components/icon";
import { MenuCheckboxItem, MenuGroup, MenuItem, MenuSeparator } from "@makeplane/propel/components/menu";
import { ChevronDownOutline, ChevronUpOutline } from "@makeplane/propel/icons";
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";

export type ModuleDateFilterRequest = {
  title: string;
  key: "start_date" | "target_date";
};

export const ModuleFilterMenuContext = createContext<{
  searchQuery: string;
  openDateModal: (request: ModuleDateFilterRequest) => void;
} | null>(null);

export const useModuleFilterMenu = () => useContext(ModuleFilterMenuContext);

export function ModuleFilterGroup({ children, separator = true }: { children: ReactNode; separator?: boolean }) {
  const menu = useModuleFilterMenu();
  return menu ? (
    <>
      {separator && <MenuSeparator />}
      <MenuGroup>{children}</MenuGroup>
    </>
  ) : (
    <div className="py-2">{children}</div>
  );
}

export function ModuleFilterHeader(props: ComponentProps<typeof FilterHeader>) {
  const menu = useModuleFilterMenu();
  if (!menu) return <FilterHeader {...props} />;

  return (
    <MenuItem
      label={props.title}
      aria-expanded={props.isPreviewEnabled}
      onClick={props.handleIsPreviewEnabled}
      closeOnClick={false}
      trailing={<Icon icon={props.isPreviewEnabled ? ChevronUpOutline : ChevronDownOutline} size="xs" />}
    />
  );
}

export function ModuleFilterOption(props: Omit<ComponentProps<typeof FilterOption>, "title"> & { title: string }) {
  const menu = useModuleFilterMenu();
  if (!menu) return <FilterOption {...props} />;

  return (
    <MenuCheckboxItem
      label={props.title}
      icon={props.icon}
      checked={props.isChecked}
      onCheckedChange={() => props.onClick?.()}
      closeOnClick={false}
    />
  );
}

export function ModuleFilterViewToggle({ label, onClick }: { label: string; onClick: () => void }) {
  const menu = useModuleFilterMenu();
  return menu ? (
    <MenuItem label={label} onClick={onClick} closeOnClick={false} />
  ) : (
    <button type="button" className="ml-8 text-11 font-medium text-accent-primary" onClick={onClick}>
      {label}
    </button>
  );
}
