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

import { useState } from "react";
import { isEmpty, cloneDeep, omitBy, uniqBy, isEqual } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { RESTRICTED_WORK_ITEM_PROPERTY_DISPLAY_NAMES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type {
  CustomPropertyType,
  CustomProperty,
  TIssuePropertyOption,
  TIssuePropertyOptionCreateUpdateData,
  TTextAttributeConfigurations,
} from "@plane/types";
import { EIssuePropertyType } from "@plane/types";
// local imports
import { useCustomPropertyOptions } from "./context";
import { PropertyAttributes } from "./dropdowns/property-attributes";
import { PropertyTitleDescriptionInput } from "./dropdowns/property-title";
import { PropertyTypeDropdown } from "./dropdowns/property-type";
import { PropertyMandatoryFieldCheckbox } from "./mandatory-field";
import type {
  TCustomPropertyFormError,
  TCustomPropertyValidator,
  CustomPropertyCreateUpdateActions,
  CustomPropertyCreateUpdatePermissions,
} from "./types";

type CustomPropertyFormProps = {
  mode: "create" | "update";
  initialData: Partial<CustomProperty<CustomPropertyType>>;
  propertyId?: string;
  actions: CustomPropertyCreateUpdateActions;
  permissions: CustomPropertyCreateUpdatePermissions;
  propertyValidator?: TCustomPropertyValidator;
  allProperties?: CustomProperty<CustomPropertyType>[];
  onClose: () => void;
};

const defaultFormError: TCustomPropertyFormError = {
  display_name: "",
  property_type: "",
};

export const CustomPropertyForm = observer(function CustomPropertyForm(props: CustomPropertyFormProps) {
  const { mode, initialData, propertyId, actions, permissions, propertyValidator, allProperties, onClose } = props;
  // plane hooks
  const { t } = useTranslation();
  // context hooks
  const { propertyOptions, setPropertyOptions, resetOptions } = useCustomPropertyOptions();
  // state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [propertyData, setPropertyData] = useState<Partial<CustomProperty<CustomPropertyType>>>(initialData);
  const [formErrors, setFormErrors] = useState<TCustomPropertyFormError>(defaultFormError);
  const [isPropertyConfigValid, setIsPropertyConfigValid] = useState<boolean>(false);
  // derived values
  const isMandatoryFieldDisabled =
    propertyData?.property_type === EIssuePropertyType.BOOLEAN ||
    propertyData?.property_type === EIssuePropertyType.FORMULA ||
    (propertyData?.property_type === EIssuePropertyType.TEXT &&
      (propertyData?.settings as TTextAttributeConfigurations | undefined)?.display_format === "readonly");

  // get property default values
  const getDefaultValues = () => {
    if (propertyData?.property_type === EIssuePropertyType.OPTION) {
      return propertyOptions.filter((option) => option.is_default).map((option) => option.id as string) ?? [];
    }
    return propertyData?.default_value ?? [];
  };

  // validators
  const validateForm = () => {
    let hasError = false;
    const error = { ...defaultFormError };
    if (!propertyData.display_name) {
      error.display_name = t("work_item_types.settings.properties.create_update.errors.name.required");
      hasError = true;
    }
    if (propertyData.display_name && propertyData.display_name?.length > 255) {
      error.display_name = t("work_item_types.settings.properties.create_update.errors.name.max_length");
      hasError = true;
    }
    if (!propertyData.property_type) {
      error.property_type = t("work_item_types.settings.properties.create_update.errors.property_type.required");
      hasError = true;
    }
    const nonEmptyPropertyOptions = propertyOptions.filter((option) => !!option.name);
    if (propertyData.property_type === EIssuePropertyType.OPTION && nonEmptyPropertyOptions.length === 0) {
      error.options = t("work_item_types.settings.properties.create_update.errors.options.required");
      hasError = true;
    }
    if (propertyData.property_type === EIssuePropertyType.FORMULA && mode === "create" && !isPropertyConfigValid) {
      hasError = true;
    }
    setFormErrors(error);
    return hasError;
  };

  function sanitizeOptionsData(
    options: Partial<TIssuePropertyOptionCreateUpdateData>[]
  ): Partial<TIssuePropertyOptionCreateUpdateData>[] {
    const existingOptions = options.filter((option) => option.id);
    const newOptions = options.filter((option) => !option.id && option.key);
    const existingOptionNames = new Set(existingOptions.map((option) => option.name?.toLowerCase()));
    const sanitizedNewOptions = uniqBy(
      newOptions.filter((option) => {
        const name = option.name?.toLowerCase();
        return name && !existingOptionNames.has(name);
      }),
      "name"
    );
    return [...existingOptions, ...sanitizedNewOptions];
  }

  const extractFormulaPayload = (
    data: Partial<CustomProperty<CustomPropertyType>>
  ): { formulaPayload: string | undefined; propertyPayload: typeof data } => {
    if (data.property_type !== EIssuePropertyType.FORMULA) {
      return { formulaPayload: undefined, propertyPayload: data };
    }
    const { formula: formulaPayload, ...propertyPayload } = data;
    return { formulaPayload, propertyPayload };
  };

  // handlers
  const handleCreateProperty = async () => {
    if (!propertyData) return;

    let optionsPayload: Partial<TIssuePropertyOption>[] = [];
    if (propertyData.property_type === EIssuePropertyType.OPTION) {
      optionsPayload = sanitizeOptionsData(propertyOptions)
        .map((item) => {
          const { key, ...rest } = item;
          return rest;
        })
        .filter((item) => !!item.name);
    }

    const { formulaPayload, propertyPayload } = extractFormulaPayload(propertyData);

    setIsSubmitting(true);
    await actions
      .create({
        ...propertyPayload,
        formula: formulaPayload,
        options: optionsPayload,
        issue_type: propertyData.property_type,
      })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("work_item_types.settings.properties.toast.create.success.title"),
          message: t("work_item_types.settings.properties.toast.create.success.message", {
            name: propertyData?.display_name,
          }),
        });
        resetOptions();
        onClose();
        return true;
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_types.settings.properties.toast.create.error.title"),
          message: error?.error ?? t("work_item_types.settings.properties.toast.create.error.message"),
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleUpdateProperty = async () => {
    if (!propertyData || !propertyId) return;

    const originalData = cloneDeep(initialData);
    const payload =
      originalData &&
      omitBy(propertyData, (value, key) =>
        isEqual(value, originalData[key as keyof Partial<CustomProperty<CustomPropertyType>>])
      );

    // Construct options payload (only for option type)
    let optionsPayload: Partial<TIssuePropertyOption>[] = [];
    if (propertyData.property_type === EIssuePropertyType.OPTION) {
      const originalOptionsData = actions.getSortedActivePropertyOptions(propertyId);
      optionsPayload = sanitizeOptionsData(propertyOptions)
        .filter((item) => !!item.name && !isEmpty(item))
        .map((option) => {
          delete option.key;
          const originalOption = originalOptionsData?.find((optionData) => optionData.id === option.id);
          if (!originalOption) return option;
          const changedFields = omitBy(option, (value, key: string) => isEqual(value, (originalOption as any)[key]));
          if (Object.keys(changedFields).length === 0) return null;
          return { id: option.id, ...changedFields };
        })
        .filter((item) => !!item) as Partial<TIssuePropertyOption>[];
    }

    if (isEmpty(payload) && isEmpty(optionsPayload)) return;

    const { formulaPayload, propertyPayload } = extractFormulaPayload({
      ...payload,
      property_type: propertyData.property_type,
    });
    const { property_type: _, ...updatePayload } = propertyPayload;

    setIsSubmitting(true);
    await actions
      .update(propertyId, {
        ...updatePayload,
        formula: formulaPayload,
        options: optionsPayload,
      })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("work_item_types.settings.properties.toast.update.success.title"),
          message: t("work_item_types.settings.properties.toast.update.success.message", {
            name: propertyData?.display_name,
          }),
        });
        requestAnimationFrame(() => {
          resetOptions();
        });
        onClose();
        return true;
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_types.settings.properties.toast.update.error.title"),
          message: error?.error ?? t("work_item_types.settings.properties.toast.update.error.message"),
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleSubmit = async () => {
    if (validateForm()) return;
    if (mode === "create") await handleCreateProperty();
    else if (mode === "update") await handleUpdateProperty();
  };

  const handlePropertyDataChange = <T extends keyof CustomProperty<CustomPropertyType>>(
    key: T,
    value: CustomProperty<CustomPropertyType>[T],
    _shouldSync: boolean = false
  ) => {
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: "" }));
    if (
      value &&
      key === "display_name" &&
      RESTRICTED_WORK_ITEM_PROPERTY_DISPLAY_NAMES.includes(value.toString().toLowerCase())
    ) {
      setFormErrors((prev) => ({
        ...prev,
        display_name: t("common.errors.restricted_entity", {
          entity: t("common.name"),
        }),
      }));
    }
    setPropertyData((prev) => ({ ...prev, [key]: value }));
  };

  const handlePropertyObjectChange = (value: Partial<CustomProperty<CustomPropertyType>>) => {
    setPropertyData((prev) => ({ ...prev, ...value }));
    setFormErrors(defaultFormError);
    if (value.property_type) {
      setIsPropertyConfigValid(false);
    }
  };

  const handleMandatoryFieldChange = (value: boolean) => {
    if (value) {
      if (propertyData.property_type === EIssuePropertyType.OPTION) {
        setPropertyOptions((prevValue) => {
          prevValue = prevValue ? [...prevValue] : [];
          return prevValue.map((item) => ({ ...item, is_default: false }));
        });
      }
      handlePropertyDataChange("default_value", []);
    }
    handlePropertyDataChange("is_required", value);
  };

  const handlePropertyConfigValidityChange = (isValid: boolean) => {
    setIsPropertyConfigValid(isValid);
  };

  return (
    <div className="flex flex-col divide-y divide-subtle">
      {/* Form content */}
      <div className="flex flex-col gap-4 px-4 py-3 max-h-96 overflow-y-auto vertical-scrollbar scrollbar-xs">
        <PropertyTitleDescriptionInput
          propertyDetail={propertyData}
          error={formErrors.display_name}
          onPropertyDetailChange={handlePropertyDataChange}
        />
        <PropertyTypeDropdown
          propertyType={propertyData.property_type}
          propertyRelationType={propertyData.relation_type}
          currentOperationMode={mode}
          handlePropertyObjectChange={handlePropertyObjectChange}
          error={formErrors.property_type}
          isUpdateAllowed={permissions.canChangePropertyType}
          allowedPropertyTypes={permissions.allowedPropertyTypes}
        />
        <PropertyAttributes
          propertyDetail={propertyData}
          currentOperationMode={mode}
          onPropertyDetailChange={handlePropertyDataChange}
          onPropertyConfigValidityChange={handlePropertyConfigValidityChange}
          propertyValidator={propertyValidator}
          error={formErrors}
          isUpdateAllowed={permissions.canChangePropertyType}
          allProperties={allProperties}
          allowedPropertyTypes={permissions.allowedPropertyTypes}
        />
      </div>
      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3">
        <div className="flex gap-4">
          <PropertyMandatoryFieldCheckbox
            value={!!propertyData.is_required}
            defaultValue={getDefaultValues()}
            onMandatoryFieldChange={handleMandatoryFieldChange}
            isDisabled={isMandatoryFieldDisabled}
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting} className="py-1">
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (propertyData.property_type === EIssuePropertyType.FORMULA && mode === "create" && !isPropertyConfigValid)
            }
            className="py-1"
          >
            {isSubmitting ? t("common.confirming") : mode === "create" ? t("common.create") : t("common.update")}
          </Button>
        </div>
      </div>
    </div>
  );
});
