import React, { FC } from "react";
import { CUSTOMER_CONTRACT_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TCustomerContractStatus } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";

type TProps = {
  value: TCustomerContractStatus | undefined;
  onChange: (value: TCustomerContractStatus) => void;
  tabIndex?: number;
  className?: string;
  buttonClassName?: string;
  chevronClassName?: string;
  maxHeight?: "sm" | "rg" | "md" | "lg" | undefined;
  disabled: boolean;
};

export const ContractStatusDropDown: FC<TProps> = (props) => {
  const { value, onChange, maxHeight, tabIndex, buttonClassName, chevronClassName, className, disabled } = props;

  const { t } = useTranslation();

  // formatted options
  const customerContractStatusOptions = CUSTOMER_CONTRACT_STATUS.map((status) => ({
    value: status.value,
    query: t(status.i18n_name),
    content: (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
        <p className="text-sm">{t(status.i18n_name)}</p>
      </div>
    ),
  }));

  const labelContent = customerContractStatusOptions.find((status) => status.value === value);

  return (
    <CustomSearchSelect
      options={customerContractStatusOptions}
      value={value}
      label={
        <div className="truncate">
          <span className="text-sm text-custom-text-200">
            {labelContent ? (
              labelContent.content
            ) : (
              <span className="text-custom-text-400">
                {t("customers.properties.default.contract_status.placeholder")}
              </span>
            )}
          </span>
        </div>
      }
      maxHeight={maxHeight}
      tabIndex={tabIndex}
      onChange={onChange}
      className={className}
      buttonClassName={buttonClassName}
      chevronClassName={chevronClassName}
      disabled={disabled}
    />
  );
};
