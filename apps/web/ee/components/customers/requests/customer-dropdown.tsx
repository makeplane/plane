import React, { FC } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { CustomersIcon } from "@plane/propel/icons";
import { CustomSearchSelect } from "@plane/ui";
import { SwitcherLabel } from "@/components/common/switcher-label";
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
  customButton?: React.ReactNode;
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
      content: <SwitcherLabel logo_url={customer?.logo_url} name={customer?.name} LabelIcon={CustomersIcon} />,
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
