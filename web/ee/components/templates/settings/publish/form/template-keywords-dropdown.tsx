import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TTemplateKeywords } from "@plane/types";
import { MultiSelectDropdown } from "@plane/ui";
import { cn, joinWithConjunction } from "@plane/utils";
// plane web imports
import { useTemplateHelper } from "@/plane-web/hooks/store/templates/use-template-helper";

type TSelectKeywordsProps = {
  value: TTemplateKeywords[];
  handleChange: (value: TTemplateKeywords[]) => void;
  buttonContainerClassName?: string;
};

export const TemplateKeywordsDropdown: React.FC<TSelectKeywordsProps> = observer((props) => {
  const { value, handleChange, buttonContainerClassName } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getTemplateKeywords } = useTemplateHelper();
  // derived values
  const templateKeywords = getTemplateKeywords();
  const options = templateKeywords.map((keyword) => ({
    data: keyword,
    value: keyword,
  }));

  return (
    <MultiSelectDropdown
      value={value as TTemplateKeywords[]}
      options={options}
      onChange={(value) => handleChange(value as TTemplateKeywords[])}
      keyExtractor={(option) => option.data}
      containerClassName="h-auto"
      buttonContainerClassName={buttonContainerClassName}
      buttonContent={(isOpen) => (
        <span
          className={cn("flex items-center justify-between gap-1 text-sm w-full truncate", {
            "text-custom-text-400": value.length === 0,
          })}
        >
          <span className="truncate">
            {value.length > 0 ? joinWithConjunction(value) : t("templates.settings.form.publish.keywords.placeholder")}
          </span>
          <ChevronDown
            size={16}
            className={cn("transition-all duration-300 flex-shrink-0", isOpen ? "rotate-180" : "rotate-0")}
          />
        </span>
      )}
    />
  );
});
