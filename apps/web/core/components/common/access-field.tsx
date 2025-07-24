import { LucideIcon } from "lucide-react";
// plane ui
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/ui";
// plane utils
import { cn } from "@plane/utils";

type Props = {
  onChange: (value: number) => void;
  value: number;
  accessSpecifiers: {
    key: number;
    i18n_label?: string;
    label?: string;
    icon: LucideIcon;
  }[];
  isMobile?: boolean;
};

// TODO: Remove label once i18n is done
export const AccessField = (props: Props) => {
  const { onChange, value, accessSpecifiers, isMobile = false } = props;
  const { t } = useTranslation();

  return (
    <div className="flex flex-shrink-0 items-stretch gap-0.5 rounded border-[1px] border-custom-border-200 p-1">
      {accessSpecifiers.map((access, index) => {
        const label = access.i18n_label ? t(access.i18n_label) : access.label;
        return (
          <Tooltip key={access.key} tooltipContent={label} isMobile={isMobile}>
            <button
              type="button"
              onClick={() => onChange(access.key)}
              className={cn(
                "flex-shrink-0 relative flex justify-center items-center w-5 h-5 rounded-sm p-1 transition-all",
                value === access.key ? "bg-custom-background-80" : "hover:bg-custom-background-80"
              )}
              tabIndex={2 + index}
            >
              <access.icon
                className={cn(
                  "h-3.5 w-3.5 transition-all",
                  value === access.key ? "text-custom-text-100" : "text-custom-text-400"
                )}
                strokeWidth={2}
              />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};
