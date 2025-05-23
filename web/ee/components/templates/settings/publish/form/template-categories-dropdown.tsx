import { useMemo } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { MultiSelectDropdown } from "@plane/ui";
import { cn, joinWithConjunction } from "@plane/utils";
// plane web imports
import { useTemplateHelper } from "@/plane-web/hooks/store/templates/use-template-helper";
type TSelectCategoriesProps = {
  value: string[];
  handleChange: (value: string[]) => void;
  buttonContainerClassName?: string;
};

export const TemplateCategoriesDropdown: React.FC<TSelectCategoriesProps> = observer((props) => {
  const { value, handleChange, buttonContainerClassName } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { sortedTemplateCategories, getTemplateCategoryById } = useTemplateHelper();
  // derived values
  const options = sortedTemplateCategories.map((category) => ({
    data: category.id,
    value: category.name,
  }));
  const selectedCategoriesNames = useMemo(
    () => value.map((categoryId) => getTemplateCategoryById(categoryId)?.name ?? "").filter(Boolean),
    [value, getTemplateCategoryById]
  );

  return (
    <MultiSelectDropdown
      value={value as string[]}
      options={options}
      onChange={(value) => handleChange(value)}
      keyExtractor={(option) => option.data}
      containerClassName="h-auto"
      buttonContainerClassName={buttonContainerClassName}
      buttonContent={(isOpen) => (
        <span
          className={cn("flex items-center justify-between gap-1 text-sm w-full truncate", {
            "text-custom-text-400": selectedCategoriesNames.length === 0,
          })}
        >
          <span className="truncate">
            {selectedCategoriesNames.length > 0
              ? joinWithConjunction(selectedCategoriesNames)
              : t("templates.settings.form.publish.category.placeholder")}
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
