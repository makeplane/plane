/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { MODULE_VIEW_LAYOUTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronDownOutline } from "@makeplane/propel/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { ModuleLayoutIcon } from "@/components/modules";
import { useModuleFilter } from "@/hooks/store/use-module-filter";
import { useProject } from "@/hooks/store/use-project";

export const ModulesListMobileHeader = observer(function ModulesListMobileHeader() {
  const { currentProjectDetails } = useProject();
  const { updateDisplayFilters } = useModuleFilter();
  const { t } = useTranslation();

  return (
    <div className="flex justify-start md:hidden">
      <Menu>
        <div className="flex flex-grow justify-start border-b border-subtle bg-surface-1 py-2 text-13 text-secondary">
          <MenuTrigger
            render={
              <button
                type="button"
                className="flex flex-grow items-center justify-center gap-2 px-page-x text-13 text-secondary"
              />
            }
          >
            <span>{t("common.layout")}</span>
            <ChevronDownOutline className="my-auto h-4 w-4 text-secondary" />
          </MenuTrigger>
        </div>
        <MenuContent side="bottom" align="start">
          {MODULE_VIEW_LAYOUTS.map((layout) => {
            if (layout.key == "gantt") return null;
            return (
              <MenuItem
                key={layout.key}
                label={t(layout.i18n_title)}
                icon={<Icon icon={<ModuleLayoutIcon layoutType={layout.key} />} />}
                onClick={() => {
                  updateDisplayFilters(currentProjectDetails!.id.toString(), { layout: layout.key });
                }}
              />
            );
          })}
        </MenuContent>
      </Menu>
    </div>
  );
});
