/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { MODULE_VIEW_LAYOUTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
import { CustomMenu, Row } from "@plane/ui";
import { ModuleLayoutIcon } from "@/components/modules";
import { useModuleFilter } from "@/hooks/store/use-module-filter";
import { useProject } from "@/hooks/store/use-project";

export const ModulesListMobileHeader = observer(function ModulesListMobileHeader() {
  const { currentProjectDetails } = useProject();
  const { updateDisplayFilters } = useModuleFilter();
  const { t } = useTranslation();

  return (
    <div className="flex justify-start md:hidden">
      <CustomMenu
        maxHeight={"md"}
        className="flex flex-grow justify-start border-b border-subtle bg-surface-1 py-2 text-13 text-secondary"
        // placement="bottom-start"
        customButton={
          <Row className="flex flex-grow justify-center gap-2 text-13 text-secondary">
            <span>Layout</span> <ChevronDownIcon className="my-auto h-4 w-4 text-secondary" strokeWidth={1} />
          </Row>
        }
        customButtonClassName="flex flex-grow justify-center items-center text-secondary text-13"
        closeOnSelect
      >
        {MODULE_VIEW_LAYOUTS.map((layout) => {
          if (layout.key == "gantt") return;
          return (
            <CustomMenu.MenuItem
              key={layout.key}
              onClick={() => {
                updateDisplayFilters(currentProjectDetails!.id.toString(), { layout: layout.key });
              }}
              className="flex items-center gap-2"
            >
              <ModuleLayoutIcon layoutType={layout.key} />
              <div className="text-tertiary">{t(layout.i18n_title)}</div>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </div>
  );
});
