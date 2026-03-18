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
import { WorkItemTypesPropertiesListHeader } from "../properties-list-header";
import { Menu } from "@plane/propel/menu";
import { Button } from "@plane/propel/button";
import { ChevronDownIcon, ImportIcon } from "@plane/propel/icons";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { useTranslation } from "@plane/i18n";
import { IssuePropertiesRoot } from "../../../work-item-types/properties/root";

export const ProjectPropertiesTabContent = observer(function WorkspacePropertiesTabContent() {
  // hooks
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h6 className="text-h6-medium">{t("work_item_types.settings.properties.title")}</h6>
        <p className="text-body-xs-regular text-secondary">{t("work_item_types.settings.properties.description")}</p>
      </div>
      {/* Filters header */}
      <WorkItemTypesPropertiesListHeader
        count={0}
        actionButton={
          <Menu
            customButton={
              <Button size="lg" appendIcon={<ChevronDownIcon className="size-4" />}>
                {t("work_item_types.settings.properties.add_button")}
              </Button>
            }
          >
            {/* <Menu.MenuItem className="flex gap-2 items-center">
              <PlusIcon className="size-4" />
              {t("work_item_types.settings.types.project.add_button.create_new")}
            </Menu.MenuItem>  */}
            <Menu.MenuItem className="flex gap-2 items-center" onClick={() => {}}>
              <ImportIcon className="size-4" />{" "}
              {t("work_item_types.settings.properties.project.add_button.import_from_workspace")}
            </Menu.MenuItem>
          </Menu>
        }
      />
      {/* List */}
      <EmptyStateCompact
        assetKey="custom-properties"
        title={"No custom properties added"}
        description={"Define properties to track specific data for your work item types."}
      />
    </div>
  );
});
