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
import { CloseIcon } from "@plane/propel/icons";
import { Menu } from "@plane/propel/menu";
import { EPillSize, Pill } from "@plane/propel/pill";
import { IssuePropertyLogo } from "@/components/work-item-types/properties/common/issue-property-logo";
import { useIssueProperty } from "@/plane-web/hooks/store";

type Props = {
  typeId: string;
  propertyId: string;
  handleRemove: () => void;
};
export const TypeFormPropertiesListItem = observer(function TypeFormPropertiesListItem(props: Props) {
  const { typeId, propertyId, handleRemove } = props;

  const { t } = useTranslation();
  const property = useIssueProperty(typeId, propertyId);

  if (!property) return null;

  const intakeFormT = (path: string) => t(`project_settings.features.intake.form.${path}`);

  return (
    <div className="p-3 rounded-lg border border-subtle">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <IssuePropertyLogo icon_props={property?.logo_props?.icon} colorClassName="text-secondary" size={12} />
          <span className="text-secondary text-13 font-medium">{property.display_name}</span>
        </div>
        <div className="flex gap-2 items-center">
          {property.is_required && (
            <Pill className="border-none text-11 font-semibold text-tertiary" size={EPillSize.XS}>
              Mandatory
            </Pill>
          )}
          {!property.is_required && (
            <Menu ellipsis>
              <Menu.MenuItem onClick={handleRemove} className="flex items-center gap-2 text-danger-primary">
                <CloseIcon className="size-4" />
                <span className="text-11">{intakeFormT("remove_property")}</span>
              </Menu.MenuItem>
            </Menu>
          )}
        </div>
      </div>
    </div>
  );
});
