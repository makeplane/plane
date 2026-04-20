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

import { useEffect } from "react";
import type { FieldValues } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { CUSTOMER_WEBSITE_AND_SOURCE_URL_REGEX } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TCustomer } from "@plane/types";
import { Input } from "@plane/ui";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane web imports
import { ContractStatusDropDown, StageDropDown } from "@/components/customers/dropdowns";
import type { TCustomerProperty } from "@/store/customers/permissions/root";

type TProps = {
  updateProperty: (data: Partial<TCustomer>) => void;
  customer: TCustomer;
  canEditProperty: (property: TCustomerProperty) => boolean;
};

export function CustomerDefaultSidebarProperties(props: TProps) {
  const { updateProperty, customer, canEditProperty } = props;
  // i18n
  const { t } = useTranslation();
  // hooks
  const { getUserDetails } = useMember();

  const createdByDetails = getUserDetails(customer.created_by);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-13 font-medium mb-2">{t("customers.sidebar.properties")}</p>
      <div className="flex h-8 gap-2 items-center">
        <div className="w-2/5 flex-shrink-0">
          <span className="text-13 text-secondary">{t("customers.properties.default.email.name")}</span>
        </div>
        <div className="flex-grow">
          <PropertyField
            value={customer.email}
            key={"email"}
            updateProperty={(value) => {
              updateProperty({ email: value.toString() });
            }}
            rules={{
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                message: t("customers.properties.default.email.validation.pattern"),
              },
            }}
            type="email"
            placeholder={t("customers.properties.default.email.placeholder")}
            disabled={!canEditProperty("name")}
          />
        </div>
      </div>
      <div className="flex h-8 gap-2 items-center">
        <div className="w-2/5 flex-shrink-0">
          <span className="text-13 text-secondary">{t("customers.properties.default.website_url.name")}</span>
        </div>
        <div className="flex-grow">
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
            disabled={!canEditProperty("website_url")}
          />
        </div>
      </div>
      <div className="flex h-8 gap-2 items-center">
        <div className="w-2/5 flex-shrink-0">
          <span className="text-13 text-secondary">{t("customers.properties.default.size.name")}</span>
        </div>
        <div className="flex-grow">
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
            disabled={!canEditProperty("custom_properties")}
          />
        </div>
      </div>
      <div className="flex h-8 gap-2 items-center">
        <div className="w-2/5 flex-shrink-0">
          <span className="text-13 text-secondary">{t("customers.properties.default.domain.name")}</span>
        </div>
        <div className="flex-grow">
          <PropertyField
            value={customer.domain}
            updateProperty={(value) => {
              updateProperty({ domain: value.toString() });
            }}
            placeholder={t("customers.properties.default.domain.placeholder_short")}
            disabled={!canEditProperty("custom_properties")}
          />
        </div>
      </div>
      <div className="flex h-8 gap-2 items-center">
        <div className="w-2/5 flex-shrink-0">
          <span className="text-13 text-secondary">{t("customers.properties.default.contract_status.name")}</span>
        </div>
        <ContractStatusDropDown
          value={customer.contract_status}
          onChange={(value) => {
            updateProperty({ contract_status: value });
          }}
          className="flex-grow w-3/5"
          buttonClassName="group border-none flex-grow w-full px-3 py-2"
          chevronClassName="hidden group-hover:inline"
          disabled={!canEditProperty("contract_status")}
        />
      </div>
      <div className="flex h-8 gap-2 items-center">
        <div className="w-2/5 flex-shrink-0">
          <span className="text-13 text-secondary">{t("customers.properties.default.stage.name")}</span>
        </div>
        <StageDropDown
          value={customer.stage}
          onChange={(value) => {
            updateProperty({ stage: value });
          }}
          className="flex-grow w-3/5"
          buttonClassName="group border-none flex-grow w-full px-3 py-2"
          chevronClassName="hidden group-hover:inline"
          disabled={!canEditProperty("stage")}
        />
      </div>
      <div className="flex h-8 gap-2 items-center">
        <div className="w-2/5 flex-shrink-0">
          <span className="text-13 text-secondary">{t("customers.properties.default.revenue.name")}</span>
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
          disabled={!canEditProperty("revenue")}
        />
      </div>
      {createdByDetails && (
        <div className="flex h-8 gap-2 items-center">
          <div className="w-2/5 flex-shrink-0">
            <span className="text-13 text-secondary">{t("common.created_by")}</span>
          </div>
          <div className="w-full h-full flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-13 justify-between cursor-not-allowed">
            <ButtonAvatars showTooltip userIds={createdByDetails.id} />
            <span className="flex-grow truncate text-11 leading-5">{createdByDetails?.display_name}</span>
          </div>
        </div>
      )}
    </div>
  );
}

type TPropertyFiledProps = {
  value: string | number | undefined;
  updateProperty: (data: string | number) => void;
  rules?: FieldValues;
  type?: "email" | "number" | "link" | "text";
  placeholder?: string;
  disabled?: boolean;
};

function PropertyField(props: TPropertyFiledProps) {
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
          className="w-full"
        />
      )}
    />
  );
}
