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

import { useEffect, useState, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { Button } from "@plane/ui";
import { InfoIcon } from "@plane/propel/icons";
import { EIssuePropertyType } from "@plane/types";
import type { TIssueProperty, TOperationMode, TFormulaValidateResponse } from "@plane/types";
import {
  extractFieldReferences,
  detectCircularReference,
  convertDisplayNamesToIds,
  convertIdsToDisplayNames,
  parseApiError,
} from "@plane/utils";
// local imports
import { FormulaInput } from "./formula/formula-input";

// Default work item properties that can be used in formulas (aligned with backend WORK_ITEM_DEFAULT_FIELDS)
const DEFAULT_WORK_ITEM_PROPERTIES = [
  {
    id: "name",
    display_name: "Name",
    property_type: EIssuePropertyType.TEXT,
    is_active: true,
    is_required: false,
    is_multi: false,
    settings: { display_format: "single-line" },
  } satisfies Partial<TIssueProperty<EIssuePropertyType.TEXT>>,
  {
    id: "start_date",
    display_name: "Start Date",
    property_type: EIssuePropertyType.DATETIME,
    is_active: true,
    is_required: false,
    is_multi: false,
    settings: { display_format: "MMM dd, yyyy" },
  } satisfies Partial<TIssueProperty<EIssuePropertyType.DATETIME>>,
  {
    id: "target_date",
    display_name: "Due Date",
    property_type: EIssuePropertyType.DATETIME,
    is_active: true,
    is_required: false,
    is_multi: false,
    settings: { display_format: "MMM dd, yyyy" },
  } satisfies Partial<TIssueProperty<EIssuePropertyType.DATETIME>>,
] as TIssueProperty<EIssuePropertyType>[];

type TFormulaValidationService = (formulaWithIds: string) => Promise<TFormulaValidateResponse>;

type TFormulaAttributesProps = {
  formulaPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.FORMULA>>;
  currentOperationMode: TOperationMode;
  onFormulaDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.FORMULA>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.FORMULA>[K],
    shouldSync?: boolean
  ) => void;
  onPropertyConfigValidityChange?: (isValid: boolean) => void;
  onValidateFormula?: TFormulaValidationService;
  isUpdateAllowed: boolean;
  allProperties?: TIssueProperty<EIssuePropertyType>[];
};

export const FormulaAttributes = observer(function FormulaAttributes(props: TFormulaAttributesProps) {
  const {
    formulaPropertyDetail,
    onFormulaDetailChange,
    onPropertyConfigValidityChange,
    onValidateFormula,
    allProperties = [],
  } = props;

  // plane hooks
  const { t } = useTranslation();

  // Combine default work item properties with custom properties
  const combinedProperties = useMemo(() => {
    return [...DEFAULT_WORK_ITEM_PROPERTIES, ...allProperties];
  }, [allProperties]);

  // Compute stored formula as a primitive string
  const storedFormula: string = formulaPropertyDetail.formula || "";

  // local state
  const [formulaInput, setFormulaInput] = useState<string>(storedFormula);
  const [validationError, setValidationError] = useState<string>("");
  const [validationSuccess, setValidationSuccess] = useState<string>("");
  const [isValidating, setIsValidating] = useState(false);

  // Update display when stored formula changes (initial load or external change)
  // Uses primitive string dependency so the effect only runs when the actual formula value changes
  useEffect(() => {
    const displayFormula = convertIdsToDisplayNames(storedFormula, combinedProperties);
    setFormulaInput(displayFormula);
  }, [storedFormula, combinedProperties]);

  // Handle formula change - convert display names to IDs for storage
  const handleFormulaChange = (newFormula: string) => {
    // User edits: "{Due Date} - {Start Date}"
    setFormulaInput(newFormula);
    setValidationError("");
    setValidationSuccess("");
    // Reset validation state when formula changes
    onPropertyConfigValidityChange?.(false);

    // Convert to IDs for storage: "{{target_date}} - {{start_date}}"
    const formulaWithIds: string = convertDisplayNamesToIds(newFormula, combinedProperties);

    // Extract IDs for referenced_properties
    const refs: string[] = extractFieldReferences(formulaWithIds);

    // Check for circular references
    if (formulaPropertyDetail.id && refs.length > 0) {
      const propertyFormulaMap = new Map<string, { formula?: string }>();
      combinedProperties.forEach((p) => {
        if (p.id) {
          const formula = p.formula;
          if (formula) {
            propertyFormulaMap.set(p.id, { formula });
          }
        }
      });

      const hasCircular = detectCircularReference(formulaPropertyDetail.id, formulaWithIds, propertyFormulaMap);
      if (hasCircular) {
        setValidationError(t("work_item_types.settings.properties.create_update.errors.formula.circular_reference"));
        return;
      }
    }

    // Update formula at top level (store with IDs)
    // Note: We don't send referenced_properties - backend will parse them from the formula
    onFormulaDetailChange("formula", formulaWithIds);
  };

  // Handle test button click — calls backend validate API
  const handleTest = async () => {
    if (!formulaInput) {
      setValidationError(t("work_item_types.settings.properties.formula.error.empty"));
      return;
    }

    if (!onValidateFormula) {
      setValidationError(t("work_item_types.settings.properties.formula.error.missing_context"));
      return;
    }

    setIsValidating(true);
    setValidationError("");
    setValidationSuccess("");

    try {
      const formulaWithIds = convertDisplayNamesToIds(formulaInput, combinedProperties);
      const response = await onValidateFormula(formulaWithIds);
      if (response.validated_formula && !response.validated_formula.valid) {
        setValidationError(
          response.validated_formula.error || t("work_item_types.settings.properties.formula.error.validation_failed")
        );
        onPropertyConfigValidityChange?.(false);
      } else if (response.validated_formula?.valid) {
        const resultType = response.validated_formula.result_type;
        const referencedCount = response.validated_formula.referenced_fields.length;
        setValidationSuccess(
          referencedCount > 0
            ? t("work_item_types.settings.properties.formula.validation_success_with_refs", {
                resultType: resultType || "value",
                count: referencedCount,
              })
            : t("work_item_types.settings.properties.formula.validation_success", {
                resultType: resultType || "value",
              })
        );
        onPropertyConfigValidityChange?.(true);
      }
    } catch (error: unknown) {
      setValidationError(parseApiError(error));
      onPropertyConfigValidityChange?.(false);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Formula field label */}
      <div className="flex items-center gap-1">
        <span className="text-caption-sm-regular text-tertiary">
          {t("work_item_types.settings.properties.formula.field_label")}
        </span>
        <Tooltip tooltipContent={t("work_item_types.settings.properties.formula.tooltip")}>
          <span className="shrink-0">
            <InfoIcon className="size-3 text-tertiary" />
          </span>
        </Tooltip>
      </div>

      {/* Formula input */}
      <FormulaInput
        value={formulaInput}
        onChange={handleFormulaChange}
        properties={combinedProperties}
        currentPropertyId={formulaPropertyDetail.id}
        error={validationError}
        placeholder={t("work_item_types.settings.properties.formula.placeholder")}
        disabled={false}
      />

      {/* Success message */}
      {validationSuccess && (
        <div className="mt-1 text-caption-sm-regular text-success-primary">{validationSuccess}</div>
      )}

      {/* Test button */}
      {formulaInput && (
        <div>
          <Button variant="neutral-primary" size="sm" onClick={handleTest} disabled={isValidating}>
            {isValidating
              ? t("work_item_types.settings.properties.formula.validating")
              : t("work_item_types.settings.properties.formula.test_button")}
          </Button>
        </div>
      )}
    </div>
  );
});
