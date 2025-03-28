import React, { FC } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { CustomersIcon, CustomSearchSelect } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  value: any;
  onChange: (value: string[] | string) => void;
  tabIndex?: number;
  className?: string;
  customButtonClassName?: string;
  chevronClassName?: string;
  maxHeight?: "sm" | "rg" | "md" | "lg" | undefined;
  disabled: boolean;
  customButton?: JSX.Element;
  multiple?: boolean;
};

export const CustomerDropDown: FC<TProps> = observer((props) => {
  const {
    value,
    onChange,
    maxHeight,
    tabIndex,
    customButtonClassName,
    chevronClassName,
    className,
    disabled,
    customButton,
    multiple = false,
  } = props;

  const { t } = useTranslation();

  // store hooks
  const { customerIds, getCustomerById } = useCustomers();

  // formatted options
  const customersOptions = customerIds.map((id) => {
    const customer = getCustomerById(id);
    return {
      value: customer?.id,
      query: `${customer?.name}`,
      content: (
        <div className="flex items-center gap-2">
          <div className="p-1">
            {customer?.logo_url ? (
              <img
                src={getFileURL(customer.logo_url)}
                alt="customer-logo"
                className="rounded-sm w-3 h-3 object-cover"
              />
            ) : (
              <div className="bg-custom-background-90 rounded-md flex items-center justify-center h-3 w-3">
                <CustomersIcon className="size-4 opacity-50" />
              </div>
            )}
          </div>
          <p className="text-sm">{customer?.name}</p>
        </div>
      ),
    };
  });

  // label content for single select variant
  const labelContent = multiple ? undefined : customersOptions.find((option) => option.value === value);
  return (
    <CustomSearchSelect
      options={customersOptions}
      value={value}
      label={
        <div className="truncate">
          <span className="text-sm text-custom-text-200">
            {labelContent ? (
              labelContent.content
            ) : (
              <span className="text-custom-text-400 text-xs">{t("customers.dropdown.placeholder")}</span>
            )}
          </span>
        </div>
      }
      multiple={multiple}
      customButton={customButton}
      maxHeight={maxHeight}
      tabIndex={tabIndex}
      onChange={onChange}
      className={className}
      customButtonClassName={customButtonClassName}
      chevronClassName={chevronClassName}
      disabled={disabled}
    />
  );
});
