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
import { Button } from "@plane/propel/button";
import { Combobox } from "@plane/propel/combobox";
import { filterIntakeEligibleProperties } from "@plane/propel/domain/intake-form";
import { AddIcon } from "@plane/propel/icons";
import { EPillSize, Pill } from "@plane/propel/pill";
import { cn } from "@plane/propel/utils";
import type { IIssueType } from "@plane/types";
import { Checkbox } from "@plane/ui";
import { IssuePropertyLogo } from "@/components/work-item-types/properties/common/issue-property-logo";

type Props = {
  onSelect: (value: string[]) => void;
  workItemType: IIssueType;
  selectedFields?: string[];
};
export const TypePropertiesDropdown = observer(function TypePropertiesDropdown(props: Props) {
  const { workItemType, selectedFields = [], onSelect } = props;

  const { t } = useTranslation();

  const intakeFormT = (path: string) => t(`project_settings.features.intake.form.${path}`);
  // Filter out RELATION type properties for intake forms
  const properties = filterIntakeEligibleProperties(workItemType.activeProperties);

  const handleSelect = (value: string[] | string) => {
    if (Array.isArray(value)) {
      onSelect(value);
    } else {
      onSelect([value]);
    }
  };

  const isPropertyDisabled = (propertyId: string): boolean => {
    const property = properties.find((property) => property.id === propertyId);
    if (!property?.id) return true;

    if (!selectedFields.includes(propertyId) && property.is_required) return false;

    if (property.is_required) return true;

    return false;
  };

  return (
    <Combobox multiSelect value={selectedFields} onValueChange={(value) => handleSelect(value ?? [])}>
      <Combobox.Button>
        <Button variant="secondary" className="bg-layer-1 rounded-lg px-1.5 py-1">
          <AddIcon className="size-3" />
          <span className="truncate text-11 text-tertiary font-semibold">{intakeFormT("select_properties")}</span>
        </Button>
      </Combobox.Button>
      <Combobox.Options showSearch searchPlaceholder={intakeFormT("search_placeholder")} className="w-72 text-13">
        {properties.map((property) => {
          if (!property.id) return null;
          return (
            <Combobox.Option
              key={property.id}
              value={property.id}
              className={cn("flex items-center justify-between gap-1 py-2", {
                "opacity-80": isPropertyDisabled(property.id),
                "cursor-not-allowed": isPropertyDisabled(property.id),
              })}
              disabled={isPropertyDisabled(property.id)}
            >
              <div className="flex items-center gap-1">
                <Checkbox checked={selectedFields.includes(property.id)} disabled={isPropertyDisabled(property.id)} />
                <IssuePropertyLogo
                  size={12}
                  icon_props={property?.logo_props?.icon}
                  colorClassName={property.is_active ? "text-secondary" : "text-tertiary"}
                />
                <span className="text-secondary text-13">{property.name}</span>
              </div>
              {property.is_required && (
                <Pill size={EPillSize.XS} className="text-tertiary border-none text-11">
                  {t("common.mandatory")}
                </Pill>
              )}
            </Combobox.Option>
          );
        })}
      </Combobox.Options>
    </Combobox>
  );
});
