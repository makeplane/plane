import { useState } from "react";
import cloneDeep from "lodash/cloneDeep";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import omitBy from "lodash/omitBy";
import uniqBy from "lodash/uniqBy";
import { observer } from "mobx-react";
// ui
import { TOAST_TYPE, ToggleSwitch, Tooltip, setPromiseToast, setToast } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web components
import {
  IssuePropertyLogo,
  IssuePropertyQuickActions,
  PropertyAttributesDropdown,
  PropertyMandatoryFieldToggle,
  PropertyTitleDropdown,
  PropertyTypeDropdown,
  TIssuePropertyCreateList,
} from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueProperty, useIssueType, usePropertyOptions } from "@/plane-web/hooks/store";
// plane web types
import {
  EIssuePropertyType,
  TIssueProperty,
  TCreationListModes,
  TOperationMode,
  TIssuePropertyOption,
  TIssuePropertyOptionCreateUpdateData,
} from "@/plane-web/types";

type TIssuePropertyListItem = {
  issueTypeId: string;
  issuePropertyId?: string;
  issuePropertyCreateListData?: TIssuePropertyCreateList;
  operationMode?: TOperationMode;
  handleIssuePropertyCreateList: (mode: TCreationListModes, value: TIssuePropertyCreateList) => void;
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
  const { issueTypeId, issuePropertyId, issuePropertyCreateListData, operationMode, handleIssuePropertyCreateList } =
    props;
  // store hooks
  const issueType = useIssueType(issueTypeId);
  const issueProperty = useIssueProperty(issueTypeId, issuePropertyId);
  const { propertyOptions, setPropertyOptions, resetOptions } = usePropertyOptions();
  // derived values
  let key: string;
  let issuePropertyCreateData;
  if (issuePropertyCreateListData) {
    ({ key, ...issuePropertyCreateData } = issuePropertyCreateListData);
  }
  const issuePropertyDetail = issuePropertyId ? issueProperty?.asJSON : issuePropertyCreateData;
  // If issuePropertyDetail is not available, return null
  if (!issuePropertyDetail) return null;
  const sortedActivePropertyOptions = issueProperty?.sortedActivePropertyOptions;
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
      error.display_name = "You must name your property.";
      hasError = true;
    }
    if (issuePropertyData.display_name && issuePropertyData.display_name?.length > 255) {
      error.display_name = "Property name should not exceed 255 characters.";
      hasError = true;
    }
    if (!issuePropertyData.property_type) {
      error.property_type = "You must select a property type.";
      hasError = true;
    }
    const nonEmptyPropertyOptions = propertyOptions.filter((option) => !!option.name);
    if (issuePropertyData.property_type === EIssuePropertyType.OPTION && nonEmptyPropertyOptions.length === 0) {
      error.options = "You must add at least one option.";
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
    await issueType
      ?.createProperty({
        ...issuePropertyData,
        options: optionsPayload,
      })
      .then(async (response) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Property ${issuePropertyData?.display_name} created successfully.`,
        });
        return response;
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to create issue property. Please try again!`,
        });
      })
      .finally(() => {
        resetOptions();
        key && handleIssuePropertyCreateList("remove", { key, ...issuePropertyData });
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
          const originalOption = originalOptionsData?.find((optionData) => optionData.id === option.id);
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
        .filter((item) => !!item);
    }

    if (isEmpty(payload) && isEmpty(optionsPayload)) return;
    setIsSubmitting(true);
    await issueProperty
      ?.updateProperty(issueTypeId, {
        ...payload,
        options: optionsPayload,
      })
      .then(() => {
        if (showToast)
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `Property ${issuePropertyData?.display_name} updated successfully.`,
          });
      })
      .catch((error) => {
        if (showToast)
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: error?.error ?? `Failed to update issue property. Please try again!`,
          });
        setIssuePropertyData(issuePropertyDetail);
      })
      .finally(() => {
        resetOptions();
        setIsSubmitting(false);
      });
  };

  const handleDiscard = () => {
    if (issuePropertyOperationMode === "create" && issuePropertyCreateListData)
      handleIssuePropertyCreateList("remove", issuePropertyCreateListData);
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
    await issueType
      ?.deleteProperty(propertyId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Property ${issuePropertyData?.display_name} deleted successfully.`,
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: `Failed to delete issue property. Please try again!`,
        });
      })
      .finally(() => {
        key && handleIssuePropertyCreateList("remove", { key, ...issuePropertyData });
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
    // sync with server only if operation mode is not create/ update
    handlePropertyDataChange("is_required", value, !issuePropertyOperationMode);
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
      loading: `${isActive ? "Enabling" : "Disabling"} ${issuePropertyData?.display_name} property`,
      success: {
        title: "Success!",
        message: () => `${issuePropertyData?.display_name} property ${isActive ? "enabled" : "disabled"} successfully.`,
      },
      error: {
        title: "Error!",
        message: () =>
          `${issuePropertyData?.display_name} property could not be ${isActive ? "enabled" : "disabled"}. Please try again.`,
      },
    });
  };

  return (
    <div
      className={cn(
        "w-full h-8 flex items-center gap-2 group px-2 py-3 my-2 text-sm rounded hover:bg-custom-background-90 cursor-default",
        {
          "bg-toast-text-warning/20 hover:bg-toast-text-warning/20": issuePropertyOperationMode,
        }
      )}
    >
      <div className="whitespace-nowrap w-48 grow flex items-center gap-2 text-sm font-medium">
        {issuePropertyData?.logo_props && (
          <div className="flex-shrink-0 size-5 grid place-items-center">
            <IssuePropertyLogo icon_props={issuePropertyData.logo_props.icon} colorClassName="text-custom-text-200" />
          </div>
        )}
        <div className="w-full truncate overflow-hidden">
          <PropertyTitleDropdown
            propertyDetail={issuePropertyData}
            currentOperationMode={issuePropertyOperationMode}
            error={issuePropertyError.display_name}
            onPropertyDetailChange={handlePropertyDataChange}
          />
        </div>
      </div>
      <div className="whitespace-nowrap w-36 text-sm">
        <PropertyTypeDropdown
          issueTypeId={issueTypeId}
          propertyType={issuePropertyData.property_type}
          propertyRelationType={issuePropertyData.relation_type}
          currentOperationMode={issuePropertyOperationMode}
          handlePropertyObjectChange={handlePropertyObjectChange}
          error={issuePropertyError.property_type}
        />
      </div>
      <div className="whitespace-nowrap w-36 text-sm">
        <PropertyAttributesDropdown
          issueTypeId={issueTypeId}
          propertyDetail={issuePropertyData}
          currentOperationMode={issuePropertyOperationMode}
          onPropertyDetailChange={handlePropertyDataChange}
          disabled={!issuePropertyData.property_type}
          error={issuePropertyError}
        />
      </div>
      <div className="w-20 text-center">
        <PropertyMandatoryFieldToggle
          value={!!issuePropertyData.is_required}
          defaultValue={getDefaultValues()}
          onMandatoryFieldChange={handleMandatoryFieldChange}
          isDisabled={isMandatoryFieldDisabled}
        />
      </div>
      <Tooltip
        className="shadow"
        tooltipContent={!!issuePropertyData.is_active ? "Click to disable" : "Click to enable"}
        position="bottom"
      >
        <div className="w-20 text-center whitespace-nowrap">
          <ToggleSwitch
            value={!!issuePropertyData.is_active}
            onChange={() => handleEnableDisable(!issuePropertyData.is_active)}
          />
        </div>
      </Tooltip>
      <div className="relative w-16 whitespace-nowrap text-right text-sm font-medium">
        <IssuePropertyQuickActions
          currentOperationMode={issuePropertyOperationMode}
          isSubmitting={isSubmitting}
          onCreateUpdate={handleCreateUpdate}
          onDiscard={handleDiscard}
          onDelete={handleDelete}
          onDisable={async () => handlePropertyDataChange("is_active", false, true)}
          onIssuePropertyOperationMode={(mode) => setIssuePropertyOperationMode(mode)}
        />
      </div>
    </div>
  );
});
