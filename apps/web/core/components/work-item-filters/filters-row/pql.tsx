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

import { useCallback, useMemo, useState } from "react";
import { AlignLeft, CircleDot } from "lucide-react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import type { FieldDef, PQLEditorHandle } from "@plane/editor";
import { FIELD_ALIASES } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import type { FilterInstance, IFilterConfig, WorkItemFilterInstance } from "@plane/shared-state";
import { getTextPropertyFilterConfig, toNegativeOperator } from "@plane/utils";
import type { PQLFilterValue, TWorkItemFilterExpression, TWorkItemFilterProperty } from "@plane/types";
import { EXTENDED_EQUALITY_OPERATOR } from "@plane/types";
// components
import { PQLEditor } from "@/components/pql/editor";
// plane web imports
import { useFiltersOperatorConfigs } from "@/plane-web/hooks/rich-filters/use-filters-operator-configs";
import type { TFiltersOperatorConfigs } from "@/ce/hooks/rich-filters/use-filters-operator-configs";

function constructFieldDefsFromConfigs(
  configManager: FilterInstance<TWorkItemFilterProperty, TWorkItemFilterExpression>["configManager"],
  operatorConfigs: TFiltersOperatorConfigs
): FieldDef[] {
  if (!configManager) return [];
  // TODO: refactor this logic and implement searchable select for ID
  const operatorConfigsWithoutIsNull = {
    allowedOperators: new Set(
      [...operatorConfigs.allowedOperators].filter((op) => op !== EXTENDED_EQUALITY_OPERATOR.ISNULL)
    ),
    allowNegative: operatorConfigs.allowNegative,
  };
  const idField = getTextPropertyFilterConfig<TWorkItemFilterProperty>("id")({
    isEnabled: true,
    filterIcon: AlignLeft,
    propertyDisplayName: "ID",
    ...operatorConfigsWithoutIsNull,
  });

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
  if (!fieldDefs.length) return [];
  const idFieldOperators: IFilterConfig<TWorkItemFilterProperty>["pqlSupportedOperators"] = new Map();
  Array.from(idField.supportedOperatorConfigsMap.entries())
    .filter(([, operatorConfig]) => operatorConfig.isOperatorEnabled)
    .forEach(([operator, operatorConfig]) => {
      // set +ve and -ve multi-select operators
      idFieldOperators.set(operator, operatorConfig);
      if (operatorConfig.allowNegative) {
        idFieldOperators.set(toNegativeOperator(operator), operatorConfig);
      }
      // set +ve and -ve single-select counter-parts
      if (operatorConfig.type === "multi_select") {
        idFieldOperators.set(operatorConfig.singleValueOperator, operatorConfig);
        if (operatorConfig.allowNegative) {
          idFieldOperators.set(toNegativeOperator(operatorConfig.singleValueOperator), operatorConfig);
        }
      }
    });
  fieldDefs.unshift({
    name: idField.label,
    value: idField.id,
    icon: idField.icon || CircleDot,
    description: idField.label,
    allowedOps: idFieldOperators,
  });

  return fieldDefs;
}

type Props = {
  disableSubmit?: boolean;
  layoutFilters: WorkItemFilterInstance;
  pqlEditorRef?: React.ForwardedRef<PQLEditorHandle>;
};

export const FiltersRowPQLSection = observer(function FiltersRowPQLSection({
  disableSubmit,
  layoutFilters,
  pqlEditorRef,
}: Props) {
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);
  // params
  const { workspaceSlug } = useParams();
  // filter config
  const operatorConfigs = useFiltersOperatorConfigs({ workspaceSlug: workspaceSlug ?? "" });
  // derived values
  const { pqlFiltersInstance, richFiltersInstance } = layoutFilters;
  const fieldDefs = useMemo(
    () =>
      layoutFilters.richFiltersInstance?.configManager
        ? constructFieldDefsFromConfigs(layoutFilters.richFiltersInstance.configManager, operatorConfigs)
        : [],
    [layoutFilters.richFiltersInstance?.configManager, operatorConfigs]
  );
  const editorKey = useMemo(() => fieldDefs.map((f) => f.value).join(","), [fieldDefs]);
  // translation
  const { t } = useTranslation();

  const handleSubmit = useCallback(
    async (value: PQLFilterValue) => {
      if (!pqlFiltersInstance) return;
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

  if (!pqlFiltersInstance || !richFiltersInstance?.configManager.areConfigsReady || !editorKey.length) return null;

  return (
    <div className="flex flex-col gap-y-1.5">
      <PQLEditor
        key={editorKey}
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
        disableSubmit={disableSubmit || !pqlFiltersInstance.hasChanges}
        isSubmitting={isSubmitting}
        ref={pqlEditorRef}
      />
      {hasError && <p className="text-caption-md-regular text-danger-secondary">{t("pql.error")}</p>}
    </div>
  );
});
