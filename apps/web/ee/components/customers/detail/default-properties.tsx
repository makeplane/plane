import React, { FC, useEffect } from "react";
import { Controller, FieldValues, useForm } from "react-hook-form";
// plane imports
import { CUSTOMER_WEBSITE_AND_SOURCE_URL_REGEX } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TCustomer } from "@plane/types";
import { Input, setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane web imports
import { ContractStatusDropDown, StageDropDown } from "@/plane-web/components/customers/dropdowns";

type TProps = {
  updateProperty: (data: Partial<TCustomer>) => void;
  customer: TCustomer;
  isDisabled?: boolean;
};

export const CustomerDefaultSidebarProperties: FC<TProps> = (props) => {
  const { updateProperty, customer, isDisabled = false } = props;
  // i18n
  const { t } = useTranslation();
  // hooks
  const { getUserDetails } = useMember();

  const createdByDetails = getUserDetails(customer.created_by);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium mb-2">{t("customers.sidebar.properties")}</p>
      <div className="flex h-8 gap-2 items-center">
        <div className="w-2/5 flex-shrink-0">
          <span className="text-sm text-custom-text-200">
            {t("customers.properties.default.email.name")} <span className="text-red-500">*</span>
          </span>
        </div>
        <div className="w-3/5 flex-grow">
          <PropertyField
            value={customer.email}
            key={"email"}
            updateProperty={(value) => {
              updateProperty({ email: value.toString() });
            }}
            rules={{
              required: t("customers.properties.default.email.validation.required"),
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                message: t("customers.properties.default.email.validation.pattern"),
              },
            }}
            type="email"
            disabled={isDisabled}
          />
        </div>
      </div>

      <div className="flex h-8 gap-2 items-center">
        <div className="w-2/5 flex-shrink-0">
          <span className="text-sm text-custom-text-200">{t("customers.properties.default.website_url.name")}</span>
        </div>
        <div className="w-3/5 flex-grow">
          <PropertyField
            value={customer.website_url}
            updateProperty={(value) => {
              updateProperty({ website_url: value.toString() });
            }}
            rules={{
              value: CUSTOMER_WEBSITE_AND_SOURCE_URL_REGEX,
              message: t("customers.properties.default.website_url.validation.pattern"),
            }}
            type="link"
            placeholder={t("customers.properties.default.website_url.placeholder_short")}
            disabled={isDisabled}
          />
        </div>
      </div>

      <div className="flex h-8 gap-2 items-center">
        <div className="w-2/5 flex-shrink-0">
          <span className="text-sm text-custom-text-200">{t("customers.properties.default.size.name")}</span>
        </div>
        <div className="w-3/5 flex-grow">
          <PropertyField
            value={customer.employees}
            updateProperty={(value) => {
              updateProperty({ employees: parseInt(value.toString()) });
            }}
            rules={{
              min: {
                value: 0,
                message: t("customers.properties.default.size.validation.min_length"),
              },
            }}
            placeholder={t("customers.properties.default.size.placeholder")}
            type="number"
            disabled={isDisabled}
          />
        </div>
      </div>

      <div className="flex h-8 gap-2 items-center">
        <div className="w-2/5 flex-shrink-0">
          <span className="text-sm text-custom-text-200">{t("customers.properties.default.domain.name")}</span>
        </div>
        <div className="w-3/5 flex-grow">
          <PropertyField
            value={customer.domain}
            updateProperty={(value) => {
              updateProperty({ domain: value.toString() });
            }}
            placeholder={t("customers.properties.default.domain.placeholder_short")}
            disabled={isDisabled}
          />
        </div>
      </div>

      <div className="flex h-8 gap-2 items-center">
        <div className="w-2/5 flex-shrink-0">
          <span className="text-sm text-custom-text-200">{t("customers.properties.default.contract_status.name")}</span>
        </div>
        <ContractStatusDropDown
          value={customer.contract_status}
          onChange={(value) => {
            updateProperty({ contract_status: value });
          }}
          className="flex-grow w-3/5"
          buttonClassName="group border-none w-3/5 flex-grow w-full px-3 py-2"
          chevronClassName="hidden group-hover:inline"
          disabled={isDisabled}
        />
      </div>

      <div className="flex h-8 gap-2 items-center">
        <div className="w-2/5 flex-shrink-0">
          <span className="text-sm text-custom-text-200">{t("customers.properties.default.stage.name")}</span>
        </div>
        <StageDropDown
          value={customer.stage}
          onChange={(value) => {
            updateProperty({ stage: value });
          }}
          className="flex-grow w-3/5"
          buttonClassName="group border-none w-3/5 flex-grow w-full px-3 py-2"
          chevronClassName="hidden group-hover:inline"
          disabled={isDisabled}
        />
      </div>

      <div className="flex h-8 gap-2 items-center">
        <div className="w-2/5 flex-shrink-0">
          <span className="text-sm text-custom-text-200">{t("customers.properties.default.revenue.name")}</span>
        </div>
        <PropertyField
          value={customer.revenue}
          updateProperty={(value) => {
            updateProperty({ revenue: parseInt(value.toString()) });
          }}
          rules={{
            min: {
              value: 0,
              message: t("customers.properties.default.revenue.validation.min_length"),
            },
          }}
          placeholder={t("customers.properties.default.revenue.placeholder_short")}
          type="number"
          disabled={isDisabled}
        />
      </div>

      {createdByDetails && (
        <div className="flex h-8 gap-2 items-center">
          <div className="w-2/5 flex-shrink-0">
            <span className="text-sm text-custom-text-200">{t("common.created_by")}</span>
          </div>
          <div className="w-full h-full flex items-center gap-1.5 rounded px-2 py-0.5 text-sm justify-between cursor-not-allowed">
            <ButtonAvatars showTooltip userIds={createdByDetails.id} />
            <span className="flex-grow truncate text-xs leading-5">{createdByDetails?.display_name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

type TPropertyFiledProps = {
  value: string | number | undefined;
  updateProperty: (data: string | number) => void;
  rules?: FieldValues;
  type?: "email" | "number" | "link" | "text";
  placeholder?: string;
  disabled?: boolean;
};
const PropertyField: FC<TPropertyFiledProps> = (props) => {
  const { value, type = "text", updateProperty, rules, placeholder, disabled = false } = props;
  const {
    control,
    formState: { errors },
    getValues,
    trigger,
    setValue,
  } = useForm();
  const { t } = useTranslation();

  const handleBlur = async () => {
    const isValid = await trigger("property");
    if (!isValid) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: errors.property?.message?.toString() || t("customers.properties.default.invalid_value"),
      });
      setValue("property", value);
      return;
    }
    const data = getValues("property");
    if (value !== data) updateProperty(data);
  };

  useEffect(() => {
    setValue("property", value);
  }, [value]);

  return (
    <Controller
      name="property"
      rules={rules}
      control={control}
      render={({ field: { value, onChange } }) => (
        <Input
          value={value}
          type={type}
          onChange={onChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "w-full border-none truncate hover:bg-custom-background-80 focus:bg-custom-background-80 rounded-md",
            disabled && "cursor-not-allowed"
          )}
        />
      )}
    />
  );
};
