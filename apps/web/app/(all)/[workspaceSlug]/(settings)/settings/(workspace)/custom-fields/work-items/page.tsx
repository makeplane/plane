/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { ECustomFieldEntityType } from "@plane/types";
// components
import { CustomFieldsManagementRoot } from "@/components/custom-fields";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// local imports
import { WorkItemCustomFieldsHeader } from "./header";

function WorkItemCustomFieldsPage() {
  return (
    <SettingsContentWrapper header={<WorkItemCustomFieldsHeader />}>
      <CustomFieldsManagementRoot
        entityType={ECustomFieldEntityType.WORK_ITEM}
        i18nPrefix="workspace_settings.settings.custom_fields.work_items"
      />
    </SettingsContentWrapper>
  );
}

export default observer(WorkItemCustomFieldsPage);
