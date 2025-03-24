import { observer } from "mobx-react";
// plane hooks
import { useTranslation } from "@plane/i18n";
import { Checkbox, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

type TPropertyActiveCheckboxProps = {
  value: boolean;
  onEnableDisable: (value: boolean) => void;
};

export const PropertyActiveCheckbox = observer((props: TPropertyActiveCheckboxProps) => {
  const { value, onEnableDisable } = props;
  // plane hooks
  const { t } = useTranslation();

  return (
    <Tooltip
      className="shadow"
      tooltipContent={
        value
          ? t("work_item_types.settings.properties.enable_disable.tooltip.disabled")
          : t("work_item_types.settings.properties.enable_disable.tooltip.enabled")
      }
      position="bottom"
    >
      <span
        className="flex items-center gap-1.5 text-custom-text-300 text-xs font-medium cursor-pointer select-none"
        onClick={() => onEnableDisable(!value)}
      >
        <Checkbox
          checked={value}
          className={cn("size-3.5", {
            "bg-custom-background-100": !value,
          })}
          iconClassName="size-3.5"
        />
        {t("work_item_types.settings.properties.enable_disable.label")}
      </span>
    </Tooltip>
  );
});
