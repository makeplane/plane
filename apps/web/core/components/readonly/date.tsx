import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CalendarLayoutIcon } from "@plane/propel/icons";
import { cn, renderFormattedDate, getDate } from "@plane/utils";

export type TReadonlyDateProps = {
  className?: string;
  hideIcon?: boolean;
  value: Date | string | null;
  placeholder?: string;
  formatToken?: string;
};

export const ReadonlyDate = observer(function ReadonlyDate(props: TReadonlyDateProps) {
  const { className, hideIcon = false, value, placeholder, formatToken } = props;

  const { t } = useTranslation();
  const formattedDate = value ? renderFormattedDate(getDate(value), formatToken) : null;

  return (
    <div className={cn("flex items-center gap-1 text-13", className)}>
      {!hideIcon && <CalendarLayoutIcon className="size-4 flex-shrink-0" />}
      <span className="flex-grow truncate">{formattedDate ?? placeholder ?? t("common.none")}</span>
    </div>
  );
});
