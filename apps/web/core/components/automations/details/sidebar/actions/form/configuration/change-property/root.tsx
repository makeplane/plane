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

// components
import { useMemo } from "react";
import { observer } from "mobx-react";
import { useFormContext } from "react-hook-form";
// plane imports
import type { EAutomationChangePropertyType, EAutomationChangeType } from "@plane/types";
import { cn } from "@plane/utils";
// plane web imports
import { useAutomationActionConfig } from "@/plane-web/hooks/automations/use-automation-action-config";
// local imports
import type { TAutomationActionFormData } from "../../root";
import { ChangeTypeSelect } from "./change-type-select";
import { PropertyNameSelect } from "./property-name-select";
import { PropertyValueSelect } from "./property-value-select";

type TProps = {
  isDisabled?: boolean;
  projectId: string;
};

export const AutomationActionChangePropertyConfiguration = observer(
  function AutomationActionChangePropertyConfiguration(props: TProps) {
    const { isDisabled, projectId } = props;
    // form hooks
    const { watch, setValue } = useFormContext<TAutomationActionFormData>();
    // derived values
    const selectedPropertyName = watch("config.property_name");
    const selectedPropertyChangeType = watch("config.change_type");
    // config
    const { configurationMap } = useAutomationActionConfig({
      projectId,
    });

    const selectedPropertyConfig = useMemo(
      () => selectedPropertyName && configurationMap[selectedPropertyName],
      [selectedPropertyName, configurationMap]
    );

    const handlePropertyNameChange = (property: EAutomationChangePropertyType) => {
      const config = configurationMap[property];
      // Set the first supported change type as default
      setValue("config.change_type", config.supported_change_types[0]);
      // Reset property value
      setValue("config.property_value", []);
    };

    const handleChangeTypeChange = (_changeType: EAutomationChangeType) => {
      // Reset property value when change type changes
      setValue("config.property_value", []);
    };

    return (
      <div className="space-y-2.5">
        <div className="grid grid-cols-6 gap-2">
          <div
            className={cn("col-span-4 transition-all duration-200 ease-in-out", {
              "col-span-6": !selectedPropertyName,
            })}
          >
            <PropertyNameSelect isDisabled={isDisabled} onPropertyChange={handlePropertyNameChange} />
          </div>
          {selectedPropertyName && (
            <>
              <div className="col-span-2">
                <ChangeTypeSelect
                  isDisabled={isDisabled}
                  supportedChangeTypes={selectedPropertyConfig?.supported_change_types || []}
                  onChangeTypeChange={handleChangeTypeChange}
                />
              </div>
              <div className="col-span-6">
                <PropertyValueSelect
                  isDisabled={isDisabled}
                  propertyName={selectedPropertyName}
                  changeType={selectedPropertyChangeType}
                  configuration={selectedPropertyConfig}
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);
