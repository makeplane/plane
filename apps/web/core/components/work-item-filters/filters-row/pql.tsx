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

import { useCallback, useState } from "react";
import { CircleDot } from "lucide-react";
import { observer } from "mobx-react";
// plane imports
import type { FieldDef, PQLEditorHandle } from "@plane/editor";
import { FIELD_ALIASES } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import type { FilterInstance, WorkItemFilterInstance } from "@plane/shared-state";
import type { PQLFilterValue, TWorkItemFilterExpression, TWorkItemFilterProperty } from "@plane/types";
// components
import { PQLEditor } from "@/components/pql/editor";

type Props = {
  layoutFilters: WorkItemFilterInstance;
  pqlEditorRef?: React.ForwardedRef<PQLEditorHandle>;
};

function constructFieldDefsFromConfigs(
  configManager: FilterInstance<TWorkItemFilterProperty, TWorkItemFilterExpression>["configManager"]
): FieldDef[] {
  const fieldDefs: FieldDef[] = configManager.allEnabledConfigs
    .filter((c) => !(["id", "epic_id", "parent_id"] as TWorkItemFilterProperty[]).includes(c.id))
    .map((config) => {
      const propertyConfig = configManager.getConfigByProperty(config.id);
      if (!propertyConfig) return;

      return {
        name: config.label,
        value: FIELD_ALIASES[config.id] ?? config.id.toString(),
        icon: config.icon || CircleDot,
        description: config.label,
        allowedOps: propertyConfig.pqlSupportedOperators,
      };
    })
    .filter((def): def is FieldDef => !!def); // Filter out undefined values

  return fieldDefs;
}

export const FiltersRowPQLSection = observer(function FiltersRowPQLSection({ layoutFilters, pqlEditorRef }: Props) {
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);
  // derived values
  const { pqlFiltersInstance, richFiltersInstance } = layoutFilters;
  const fieldDefs = constructFieldDefsFromConfigs(layoutFilters.richFiltersInstance.configManager);
  // translation
  const { t } = useTranslation();

  const handleSubmit = useCallback(
    async (value: PQLFilterValue) => {
      try {
        setIsSubmitting(true);
        setHasError(false);
        await pqlFiltersInstance.handleSubmit?.(value);
      } catch (error) {
        console.error("Error submitting PQL filter:", error);
        setHasError(true);
      } finally {
        setIsSubmitting(false);
      }
    },
    [pqlFiltersInstance]
  );

  if (!richFiltersInstance.configManager.areConfigsReady || !fieldDefs.length) return null;

  return (
    <div className="flex flex-col gap-y-1.5">
      <PQLEditor
        fieldDefs={fieldDefs}
        value={pqlFiltersInstance.value.json}
        onChange={(val) => {
          setHasError(false);
          pqlFiltersInstance.updateValue({
            json: val.json,
            stripped: val.text,
          });
        }}
        onSubmit={async (val) =>
          await handleSubmit?.({
            json: val.json,
            stripped: val.text,
          })
        }
        isSubmitting={isSubmitting}
        ref={pqlEditorRef}
      />
      {hasError && <p className="text-caption-md-regular text-danger-secondary">{t("pql.error")}</p>}
    </div>
  );
});
