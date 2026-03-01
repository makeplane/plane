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

import { useMemo } from "react";
import { PencilLine } from "lucide-react";
// plane imports
import { EAutomationChangeType } from "@plane/types";
import type { TChangePropertyActionConfig } from "@plane/types";
import { getAutomationChangePropertyTypeLabel } from "@plane/utils";
// plane web imports
import { useAutomationActionConfig } from "@/plane-web/hooks/automations/use-automation-action-config";

type Props = {
  config: TChangePropertyActionConfig;
  projectId: string;
};

export function AutomationDetailsMainContentChangePropertyBlock(props: Props) {
  const { config, projectId } = props;
  const { configurationMap } = useAutomationActionConfig({
    projectId,
  });
  const propertyValue = useMemo(() => {
    if (!config.property_value) return null;
    const propertyDetails = configurationMap[config.property_name];
    return propertyDetails.getPreviewContent(config.property_value);
  }, [config.property_name, config.property_value, configurationMap]);

  const description: React.ReactNode = useMemo(() => {
    if (config.change_type === EAutomationChangeType.ADD) {
      return (
        <p className="flex items-center gap-1 flex-wrap text-primary">
          <span className="shrink-0 text-tertiary">add</span> {propertyValue}
        </p>
      );
    } else if (config.change_type === EAutomationChangeType.REMOVE) {
      return (
        <p className="flex items-center gap-1 flex-wrap text-primary">
          <span className="shrink-0 text-tertiary">remove</span> {propertyValue}
        </p>
      );
    } else if (config.change_type === EAutomationChangeType.UPDATE) {
      return (
        <p className="flex items-center gap-1 flex-wrap text-primary">
          <span className="shrink-0 text-tertiary">set to</span> {propertyValue}
        </p>
      );
    }
    return "";
  }, [config, propertyValue]);

  return (
    <div className="flex gap-2">
      <span className="flex-shrink-0 size-12 rounded-full bg-layer-1 grid place-items-center">
        <PencilLine className="size-5 text-tertiary" />
      </span>
      <div className="text-13 text-tertiary font-medium">
        <p>
          Update the work item{" "}
          <span className="text-primary">{getAutomationChangePropertyTypeLabel(config.property_name)}</span>
        </p>
        {description}
      </div>
    </div>
  );
}
