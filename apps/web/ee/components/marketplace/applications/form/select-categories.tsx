import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { MultiSelectDropdown } from "@plane/ui";
import { cn } from "@plane/utils";
import { useApplications } from "@/plane-web/hooks/store";
// plane web imports

type TSelectCategoriesProps = {
  value: string[];
  handleChange: (value: string[]) => void;
};

const COMMON_DROPDOWN_CONTAINER_CLASSNAME =
  "bg-custom-background-100 border border-custom-border-200 rounded-md px-2 py-1";

export const SelectCategories: React.FC<TSelectCategoriesProps> = observer((props) => {
  const { value, handleChange } = props;
  // plane hooks
  const { t } = useTranslation();
  const { allApplicationCategories } = useApplications();
  // derived values
  const options = allApplicationCategories.map((category) => ({
    data: category.id,
    value: category.name,
  }));

  return (
    <MultiSelectDropdown
      value={value}
      options={options}
      onChange={(value) => handleChange(value as string[])}
      keyExtractor={(option) => option.data}
      buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
      buttonContent={(isOpen, val) => (
        <span className="flex items-center justify-between gap-1 text-sm text-custom-text-300 w-36">
          {val && val.length > 0
            ? `${val.length} ${t("workspace_settings.settings.applications.categories")}`
            : t("workspace_settings.settings.applications.categories")}
          <ChevronDown size={16} className={cn(isOpen ? "rotate-180 ml-auto" : "rotate-0 ml-auto")} />
        </span>
      )}
      disableSearch
    />
  );
});
