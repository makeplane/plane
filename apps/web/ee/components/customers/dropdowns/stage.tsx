import React, { FC, useMemo } from "react";
import { CUSTOMER_STAGES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TCustomerStage } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";

type TProps = {
  value: TCustomerStage | undefined;
  onChange: (value: TCustomerStage) => void;
  tabIndex?: number;
  buttonClassName?: string;
  chevronClassName?: string;
  className?: string;
  maxHeight?: "sm" | "rg" | "md" | "lg" | undefined;
  disabled: boolean;
};

export const StageDropDown: FC<TProps> = (props) => {
  const { value, onChange, maxHeight, tabIndex, buttonClassName, chevronClassName, className, disabled } = props;

  const { t } = useTranslation();

  // formatted options
  const stageDropDownOptions = useMemo(
    () =>
      CUSTOMER_STAGES.map((stage) => ({
        value: stage.value,
        query: t(stage.i18n_name),
        content: <p className="text-sm">{t(stage.i18n_name)}</p>,
      })),
    [t]
  );

  const labelContent = useMemo(
    () => stageDropDownOptions.find((stage) => stage.value === value),
    [stageDropDownOptions, value]
  );

  return (
    <CustomSearchSelect
      options={stageDropDownOptions}
      value={value}
      label={
        <div className="truncate">
          <span className="text-sm text-custom-text-200">
            {labelContent ? (
              labelContent.content
            ) : (
              <span className="text-custom-text-400">{t("customers.properties.default.stage.placeholder")}</span>
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
