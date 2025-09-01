import { useState } from "react";
import cloneDeep from "lodash/cloneDeep";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import omitBy from "lodash/omitBy";
import uniqBy from "lodash/uniqBy";
import { observer } from "mobx-react";
// plane imports
import { RESTRICTED_WORK_ITEM_PROPERTY_DISPLAY_NAMES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import {
  EIssuePropertyType,
  TIssueProperty,
  TIssuePropertyOption,
  TIssuePropertyOptionCreateUpdateData,
  TIssuePropertyPayload,
  TOperationMode,
} from "@plane/types";
import { Button, InfoIcon, TOAST_TYPE, Tooltip, setPromiseToast, setToast } from "@plane/ui";
import { getIssuePropertyAttributeDisplayNameKey, cn } from "@plane/utils";
// helpers
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// plane web imports
import { usePropertyOptions } from "@/plane-web/hooks/store";
// local imports
import { PropertyActiveCheckbox } from "./active-checkbox";
import { AttributePill } from "./attributes/attribute-pill";
import { IssuePropertyLogo } from "./common/issue-property-logo";
import { PropertyAttributes } from "./dropdowns/property-attributes";
import { PropertyTitleDescriptionInput } from "./dropdowns/property-title";
import { PropertyTypeDropdown } from "./dropdowns/property-type";
import { PropertyMandatoryFieldCheckbox } from "./mandatory-field";
import { IssuePropertyQuickActions } from "./quick-actions";
import { TIssuePropertyCreateList } from "./root";

export type TCustomPropertyOperations = {
  getPropertyDetail: (propertyId: string) => TIssueProperty<EIssuePropertyType> | undefined;
  getSortedActivePropertyOptions: (propertyId: string) => TIssuePropertyOption[] | undefined;
  createProperty: (propertyData: TIssuePropertyPayload) => Promise<TIssueProperty<EIssuePropertyType> | undefined>;
  updateProperty: (propertyId: string, propertyData: TIssuePropertyPayload) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;
  removePropertyListItem: (value: TIssuePropertyCreateList) => void;
};

type TIssuePropertyListItem = {
  customPropertyId?: string;
  issuePropertyCreateListData?: TIssuePropertyCreateList;
  operationMode?: TOperationMode;
  customPropertyOperations: TCustomPropertyOperations;
  isUpdateAllowed: boolean;
  trackers?: {
    [key in "create" | "update" | "delete" | "quickActions"]?: {
      button?: string;
      eventName?: string;
    };
  };
};

export type TIssuePropertyFormError = {
  [key in keyof TIssueProperty<EIssuePropertyType>]?: string;
} & {
  options?: string;
};

const defaultIssuePropertyError: TIssuePropertyFormError = {
  display_name: "",
  property_type: "",
};

export const IssuePropertyListItem = observer((props: TIssuePropertyListItem) => {
  const {
    customPropertyId,
    issuePropertyCreateListData,
    operationMode,
    customPropertyOperations,
    isUpdateAllowed,
    trackers,
  } = props;
  const {
    getPropertyDetail,
    getSortedActivePropertyOptions,
    createProperty,
    updateProperty,
    deleteProperty,
    removePropertyListItem,
  } = customPropertyOperations;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { propertyOptions, setPropertyOptions, resetOptions } = usePropertyOptions();
  // derived values
  let key: string;
  let issuePropertyCreateData;
  if (issuePropertyCreateListData) {
    ({ key, ...issuePropertyCreateData } = issuePropertyCreateListData);
  }
  const issuePropertyDetail = customPropertyId ? getPropertyDetail(customPropertyId) : issuePropertyCreateData;
  // If issuePropertyDetail is not available, return null
  if (!issuePropertyDetail) return null;
  const sortedActivePropertyOptions = customPropertyId ? getSortedActivePropertyOptions(customPropertyId) : [];
  // state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuePropertyOperationMode, setIssuePropertyOperationMode] = useState<TOperationMode | null>(
    operationMode ?? null
  );
  const [issuePropertyData, setIssuePropertyData] =
    useState<Partial<TIssueProperty<EIssuePropertyType>>>(issuePropertyDetail);
  const [issuePropertyError, setIssuePropertyError] = useState<TIssuePropertyFormError>(defaultIssuePropertyError);
  // derived values
  // check if mandatory field is disabled for the property
  const isMandatoryFieldDisabled =
    issuePropertyData?.property_type === EIssuePropertyType.BOOLEAN ||
    (issuePropertyData?.property_type === EIssuePropertyType.TEXT &&
      issuePropertyData?.settings?.display_format === "readonly");

  // get property default values
  const getDefaultValues = () => {
    // if property is option type and operation mode is create, return default values from propertyOptions
    if (issuePropertyData?.property_type === EIssuePropertyType.OPTION) {
      return propertyOptions.filter((option) => option.is_default).map((option) => option.id as string) ?? [];
    }
    // else return default values from issuePropertyData
    return issuePropertyData?.default_value ?? [];
  };

  // validators
  const validateIssueProperty = () => {
    let hasError = false;
    const error = { ...defaultIssuePropertyError };
    if (!issuePropertyData.display_name) {
      error.display_name = t("work_item_types.settings.properties.create_update.errors.name.required");
      hasError = true;
    }
    if (issuePropertyData.display_name && issuePropertyData.display_name?.length > 255) {
      error.display_name = t("work_item_types.settings.properties.create_update.errors.name.max_length");
      hasError = true;
    }
    if (!issuePropertyData.property_type) {
      error.property_type = t("work_item_types.settings.properties.create_update.errors.property_type.required");
      hasError = true;
    }
    const nonEmptyPropertyOptions = propertyOptions.filter((option) => !!option.name);
    if (issuePropertyData.property_type === EIssuePropertyType.OPTION && nonEmptyPropertyOptions.length === 0) {
      error.options = t("work_item_types.settings.properties.create_update.errors.options.required");
      hasError = true;
    }
    setIssuePropertyError(error);
    return hasError;
  };

  function sanitizeOptionsData(
    options: Partial<TIssuePropertyOptionCreateUpdateData>[]
  ): Partial<TIssuePropertyOptionCreateUpdateData>[] {
    // Extract the existing and new options
    const existingOptions = options.filter((option) => option.id);
    const newOptions = options.filter((option) => !option.id && option.key);
    // Extract existing option names
    const existingOptionNames = new Set(existingOptions.map((option) => option.name?.toLowerCase()));
    // Filter new options to remove duplicates based on name and ensure no name exists in both lists
    const sanitizedNewOptions = uniqBy(
      newOptions.filter((option) => {
        const name = option.name?.toLowerCase();
        return name && !existingOptionNames.has(name);
      }),
      "name"
    );
    // Combine sanitized new options with existing options (for update use case)
    return [...existingOptions, ...sanitizedNewOptions];
  }

  // handlers
  const handleCreateProperty = async () => {
    if (!issuePropertyData) return;

    // create property options payload (required for option type)
    let optionsPayload: Partial<TIssuePropertyOption>[] = [];
    if (issuePropertyData.property_type === EIssuePropertyType.OPTION) {
      optionsPayload = sanitizeOptionsData(propertyOptions)
        .map((item) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { key, ...rest } = item;
          return rest;
        })
        .filter((item) => !!item.name);
    }

    setIsSubmitting(true);
    await createProperty({
      ...issuePropertyData,
      options: optionsPayload,
    })
      .then(async (response) => {
        if (trackers?.create?.eventName) {
          captureSuccess({
            eventName: trackers.create.eventName,
            payload: {
              name: issuePropertyData?.display_name,
            },
          });
        }
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("work_item_types.settings.properties.toast.create.success.title"),
          message: t("work_item_types.settings.properties.toast.create.success.message", {
            name: issuePropertyData?.display_name,
          }),
        });
        return response;
      })
      .catch((error) => {
        if (trackers?.create?.eventName) {
          captureError({
            eventName: trackers.create.eventName,
            payload: {
              name: issuePropertyData?.display_name,
            },
            error: error,
          });
        }
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_types.settings.properties.toast.create.error.title"),
          message: error?.error ?? t("work_item_types.settings.properties.toast.create.error.message"),
        });
      })
      .finally(() => {
        resetOptions();
        if (key) removePropertyListItem({ key, ...issuePropertyData });
        setIsSubmitting(false);
      });
  };

  const handleUpdateProperty = async (data: Partial<TIssueProperty<EIssuePropertyType>>, showToast: boolean = true) => {
    if (!data) return;
    // Construct the payload by filtering out unchanged properties
    const originalData = cloneDeep(issuePropertyDetail);
    const payload = originalData && omitBy(data, (value, key) => isEqual(value, originalData[key]));

    // Construct the property options payload (required for option type)
    const originalOptionsData = cloneDeep(sortedActivePropertyOptions);
    let optionsPayload: Partial<TIssuePropertyOption>[] = [];
    if (issuePropertyData.property_type === EIssuePropertyType.OPTION) {
      optionsPayload = sanitizeOptionsData(propertyOptions)
        .filter((item) => !!item.name && !isEmpty(item))
        .map((option) => {
          delete option.key;
          const originalOption = originalOptionsData?.find(
            (optionData: TIssuePropertyOptionCreateUpdateData) => optionData.id === option.id
          );
          // If the option is new, include the entire object
          if (!originalOption) {
            return option;
          }
          // If the option exists, only include the changed fields
          const changedFields = omitBy(option, (value, key: string) => isEqual(value, (originalOption as any)[key]));
          if (Object.keys(changedFields).length === 0) return null;
          // Ensure "id" is always included in the payload
          return { id: option.id, ...changedFields };
        })
        .filter((item) => !!item) as Partial<TIssuePropertyOption>[];
    }

    if (!customPropertyId || (isEmpty(payload) && isEmpty(optionsPayload))) return;
    setIsSubmitting(true);
    await updateProperty(customPropertyId, {
      ...payload,
      options: optionsPayload,
    })
      .then(() => {
        if (trackers?.update?.eventName) {
          captureSuccess({
            eventName: trackers.update.eventName,
            payload: {
              name: issuePropertyData?.display_name,
            },
          });
        }
        if (showToast)
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("work_item_types.settings.properties.toast.update.success.title"),
            message: t("work_item_types.settings.properties.toast.update.success.message", {
              name: issuePropertyData?.display_name,
            }),
          });
      })
      .catch((error) => {
        if (trackers?.update?.eventName) {
          captureError({
            eventName: trackers.update.eventName,
            payload: {
              name: issuePropertyData?.display_name,
            },
            error: error,
          });
        }
        if (showToast)
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("work_item_types.settings.properties.toast.update.error.title"),
            message: error?.error ?? t("work_item_types.settings.properties.toast.update.error.message"),
          });
        setIssuePropertyData(issuePropertyDetail);
      })
      .finally(() => {
        // reset options after mobx computed value is updated
        requestAnimationFrame(() => {
          resetOptions();
        });
        setIsSubmitting(false);
      });
  };

  const handleDiscard = () => {
    if (issuePropertyOperationMode === "create" && issuePropertyCreateListData)
      removePropertyListItem(issuePropertyCreateListData);
    else {
      setIssuePropertyData(issuePropertyDetail);
      setIssuePropertyOperationMode(null);
      resetOptions();
    }
  };

  const handleDelete = async () => {
    const propertyId = issuePropertyData?.id;
    if (!propertyId) return;

    setIsSubmitting(true);
    await deleteProperty(propertyId)
      .then(() => {
        if (trackers?.delete?.eventName) {
          captureSuccess({
            eventName: trackers.delete.eventName,
            payload: {
              name: issuePropertyData?.display_name,
            },
          });
        }
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("work_item_types.settings.properties.toast.delete.success.title"),
          message: t("work_item_types.settings.properties.toast.delete.success.message", {
            name: issuePropertyData?.display_name,
          }),
        });
      })
      .catch(() => {
        if (trackers?.delete?.eventName) {
          captureError({
            eventName: trackers.delete.eventName,
            payload: {
              name: issuePropertyData?.display_name,
            },
          });
        }
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_types.settings.properties.toast.delete.error.title"),
          message: t("work_item_types.settings.properties.toast.delete.error.message"),
        });
      })
      .finally(() => {
        if (key) removePropertyListItem({ key, ...issuePropertyData });
        setIsSubmitting(false);
      });
  };

  const handleCreateUpdate = async () => {
    // validate error
    if (validateIssueProperty()) return;
    // handle create issue property
    if (issuePropertyOperationMode === "create") await handleCreateProperty();
    // handle update issue property
    else if (issuePropertyOperationMode === "update") await handleUpdateProperty(issuePropertyData);
    // reset operation mode
    setIssuePropertyOperationMode(null);
  };

  const handlePropertyDataChange = <T extends keyof TIssueProperty<EIssuePropertyType>>(
    key: T,
    value: TIssueProperty<EIssuePropertyType>[T],
    shouldSync: boolean = false
  ) => {
    // reset error
    if (issuePropertyError[key]) setIssuePropertyError((prev) => ({ ...prev, [key]: "" }));
    if (
      value &&
      key === "display_name" &&
      RESTRICTED_WORK_ITEM_PROPERTY_DISPLAY_NAMES.includes(value.toString().toLowerCase())
    ) {
      setIssuePropertyError((prev) => ({
        ...prev,
        display_name: t("common.errors.restricted_entity", { entity: t("common.name") }),
      }));
    }
    // update property data
    setIssuePropertyData((prev) => ({ ...prev, [key]: value }));
    // sync with server if required
    if (shouldSync && issuePropertyData?.id) {
      handleUpdateProperty({
        [key]: value,
      });
    }
  };

  const handlePropertyObjectChange = (value: Partial<TIssueProperty<EIssuePropertyType>>) => {
    // update property object
    setIssuePropertyData((prev) => ({ ...prev, ...value }));
    // reset error
    setIssuePropertyError(defaultIssuePropertyError);
  };

  const handleMandatoryFieldChange = (value: boolean) => {
    // if mandatory field is enabled, remove default value
    if (value) {
      // if property is option type, set is_default to false for all options
      if (issuePropertyData.property_type === EIssuePropertyType.OPTION) {
        setPropertyOptions((prevValue) => {
          prevValue = prevValue ? [...prevValue] : [];
          return prevValue.map((item) => ({ ...item, is_default: false }));
        });
      }
      handlePropertyDataChange("default_value", []);
    }
    handlePropertyDataChange("is_required", value);
  };

  const handleEnableDisable = async (isActive: boolean) => {
    handlePropertyDataChange("is_active", isActive);
    // sync with server only if operation mode is not create/ update
    if (issuePropertyOperationMode) return;
    const enableDisablePropertyPromise = handleUpdateProperty(
      {
        is_active: isActive,
      },
      false
    );
    if (!enableDisablePropertyPromise) return;
    setPromiseToast(enableDisablePropertyPromise, {
      loading: t("work_item_types.settings.properties.toast.enable_disable.loading", {
        action: isActive ? "Enabling" : "Disabling",
        name: issuePropertyData?.display_name,
      }),
      success: {
        title: t("work_item_types.settings.properties.toast.enable_disable.success.title"),
        message: () =>
          t("work_item_types.settings.properties.toast.enable_disable.success.message", {
            name: issuePropertyData?.display_name,
            action: isActive ? "enabled" : "disabled",
          }),
      },
      error: {
        title: "Error!",
        message: () =>
          t("work_item_types.settings.properties.toast.enable_disable.error.message", {
            name: issuePropertyData?.display_name,
            action: isActive ? "enabled" : "disabled",
          }),
      },
    });
  };

  if (!issuePropertyOperationMode) {
    const i18nAttributeDisplayNameKey = getIssuePropertyAttributeDisplayNameKey(issuePropertyData);
    return (
      <div
        className={cn(
          "w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 group p-3 my-2.5 rounded-lg bg-custom-background-100 border border-custom-border-200 cursor-default overflow-hidden"
        )}
        onDoubleClick={() => setIssuePropertyOperationMode("update")}
      >
        <div className="flex items-center gap-1 text-sm font-medium">
          {issuePropertyData?.logo_props && (
            <div className="flex-shrink-0 size-5 grid place-items-center">
              <IssuePropertyLogo
                icon_props={issuePropertyData.logo_props.icon}
                colorClassName={issuePropertyData.is_active ? "text-custom-text-200" : "text-custom-text-300"}
              />
            </div>
          )}
          <div className="flex gap-1 w-full max-w-48 sm:max-w-[30vw] items-center">
            <span
              className={cn(
                "px-1 truncate",
                issuePropertyData.is_active ? "text-custom-text-200" : "text-custom-text-300"
              )}
            >
              {issuePropertyData.display_name ?? ""}
            </span>
            {issuePropertyData.description && (
              <Tooltip tooltipContent={issuePropertyData.description} position="right">
                <span className="flex-shrink-0">
                  <InfoIcon className="size-3 stroke-black cursor-help outline-none" stroke="black" />
                </span>
              </Tooltip>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center justify-end gap-2.5 transition-all duration-200">
          <div className="flex items-center gap-2.5 select-none">
            {i18nAttributeDisplayNameKey && <AttributePill data={t(i18nAttributeDisplayNameKey)} />}
            {issuePropertyData.is_required && <AttributePill data={t("common.mandatory")} />}
            {issuePropertyData.default_value && issuePropertyData.default_value.length > 0 && (
              <AttributePill data={t("common.default")} />
            )}
            {issuePropertyData.is_active && (
              <AttributePill data={t("common.active")} className="bg-green-500/15 text-green-600" />
            )}
            {!issuePropertyData.is_active && (
              <AttributePill data={t("common.disabled")} className="bg-red-500/15 text-red-600" />
            )}
          </div>
          <div
            className="flex-shrink-0 border-l border-custom-border-200 pl-2"
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <IssuePropertyQuickActions
              isPropertyDisabled={!issuePropertyData.is_active}
              onDisable={async () => handlePropertyDataChange("is_active", false, true)}
              onDelete={handleDelete}
              onIssuePropertyOperationMode={(mode) => setIssuePropertyOperationMode(mode)}
              trackers={trackers}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full flex flex-col items-center justify-center my-2.5 rounded-lg bg-custom-background-100 border border-custom-border-200 divide-y divide-custom-border-200 cursor-default"
      )}
    >
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-x sm:divide-y-0 divide-custom-border-200 ease-out transition-all duration-500">
        <div className="p-3">
          <PropertyTitleDescriptionInput
            propertyDetail={issuePropertyData}
            error={issuePropertyError.display_name}
            onPropertyDetailChange={handlePropertyDataChange}
          />
        </div>
        <div className="px-1 py-2">
          <div className="flex flex-col gap-3 px-2 pb-2 max-h-72 overflow-scroll vertical-scrollbar scrollbar-xs">
            <PropertyTypeDropdown
              propertyType={issuePropertyData.property_type}
              propertyRelationType={issuePropertyData.relation_type}
              currentOperationMode={issuePropertyOperationMode}
              handlePropertyObjectChange={handlePropertyObjectChange}
              error={issuePropertyError.property_type}
              isUpdateAllowed={isUpdateAllowed}
            />
            <PropertyAttributes
              propertyDetail={issuePropertyData}
              currentOperationMode={issuePropertyOperationMode}
              onPropertyDetailChange={handlePropertyDataChange}
              error={issuePropertyError}
              isUpdateAllowed={isUpdateAllowed}
            />
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3">
        <div className="flex gap-4">
          <PropertyMandatoryFieldCheckbox
            value={!!issuePropertyData.is_required}
            defaultValue={getDefaultValues()}
            onMandatoryFieldChange={handleMandatoryFieldChange}
            isDisabled={isMandatoryFieldDisabled}
          />
          <PropertyActiveCheckbox value={!!issuePropertyData.is_active} onEnableDisable={handleEnableDisable} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleDiscard} disabled={isSubmitting} className="py-1">
            {issuePropertyOperationMode === "create" ? t("common.cancel") : t("common.discard")}
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreateUpdate} disabled={isSubmitting} className="py-1">
            {isSubmitting
              ? t("common.confirming")
              : issuePropertyOperationMode === "create"
                ? t("common.create")
                : t("common.update")}
          </Button>
        </div>
      </div>
    </div>
  );
});
