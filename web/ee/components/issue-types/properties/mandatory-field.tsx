import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { AlertModalCore, Checkbox, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

type TPropertyMandatoryFieldCheckboxProps = {
  value: boolean;
  defaultValue: string[];
  isDisabled?: boolean;
  onMandatoryFieldChange: (value: boolean) => void;
};

export const PropertyMandatoryFieldCheckbox = observer((props: TPropertyMandatoryFieldCheckboxProps) => {
  const { value, defaultValue, isDisabled = false, onMandatoryFieldChange } = props;
  // plane imports
  const { t } = useTranslation();
  // states
  const [isDefaultResetConfirmationOpen, setIsDefaultResetConfirmationOpen] = useState<boolean>(false);

  const handleMandatoryFieldChange = (value: boolean) => {
    if (!!defaultValue.length && value) {
      setIsDefaultResetConfirmationOpen(true);
    } else {
      onMandatoryFieldChange(value);
    }
  };

  return (
    <>
      <AlertModalCore
        variant="primary"
        isOpen={isDefaultResetConfirmationOpen}
        handleClose={() => setIsDefaultResetConfirmationOpen(false)}
        handleSubmit={() => {
          onMandatoryFieldChange(true);
          setIsDefaultResetConfirmationOpen(false);
        }}
        isSubmitting={false}
        title={t("work_item_types.settings.properties.mandate_confirmation.label")}
        content={<p>{t("work_item_types.settings.properties.mandate_confirmation.content")}</p>}
        primaryButtonText={{
          loading: t("common.please_wait"),
          default: t("common.mandate"),
        }}
      />
      <div className="flex flex-shrink-0 items-center justify-center">
        <Tooltip
          className="w-52 shadow"
          tooltipContent={
            isDisabled
              ? t("work_item_types.settings.properties.mandate_confirmation.tooltip.disabled")
              : value
                ? t("work_item_types.settings.properties.mandate_confirmation.tooltip.enabled")
                : t("work_item_types.settings.properties.mandate_confirmation.tooltip.checked")
          }
          position="bottom"
        >
          <span
            className={cn(
              "flex items-center gap-1.5 text-custom-text-300 text-xs font-medium select-none",
              isDisabled ? "cursor-not-allowed" : "cursor-pointer"
            )}
            onClick={() => {
              if (isDisabled) return;
              handleMandatoryFieldChange(!value);
            }}
          >
            <Checkbox
              checked={value}
              disabled={isDisabled}
              className={cn("size-3.5", {
                "bg-custom-background-100": !value,
              })}
              iconClassName="size-3.5"
            />
            {t("work_item_types.settings.properties.mandate_confirmation.label")}
          </span>
        </Tooltip>
      </div>
    </>
  );
});
