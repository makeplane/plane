import { observer } from "mobx-react";
import { Building2 } from "lucide-react";
import { getButtonStyling } from "@plane/propel/button";
import { ChevronDownIcon } from "@plane/propel/icons";
import { CustomSearchSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import { useTranslation } from "@plane/i18n";
import { useHoIssues } from "@/hooks/store/use-ho-issues";

export const HoWorkspaceSelect = observer(function HoWorkspaceSelect() {
  const { t } = useTranslation();
  const store = useHoIssues();

  // Prepend sentinel "All departments" option so user can deselect
  const options = [
    {
      value: "",
      query: t("ho.all_departments"),
      content: (
        <div className="flex items-center gap-2 max-w-[250px]">
          <Building2 className="h-4 w-4 flex-shrink-0 text-custom-text-300" />
          <span className="truncate text-custom-text-300">{t("ho.all_departments")}</span>
        </div>
      ),
    },
    ...store.departmentOptions.map((dept) => ({
      value: dept.id,
      query: dept.name,
      content: (
        <div className="flex items-center gap-2 max-w-[250px]">
          <Building2 className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{dept.name}</span>
        </div>
      ),
    })),
  ];

  const selectedName = store.selectedDepartmentId
    ? store.departmentOptions.find((d) => d.id === store.selectedDepartmentId)?.name
    : null;

  return (
    <CustomSearchSelect
      value={store.selectedDepartmentId ?? ""}
      onChange={(val: string) => store.setDepartmentFilter(val || null)}
      options={options}
      className="border-none p-0"
      customButton={
        <div className={cn(getButtonStyling("secondary", "lg"), "gap-2")}>
          <Building2 className="h-4 w-4" />
          {selectedName ?? t("ho.all_departments")}
          <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
        </div>
      }
      customButtonClassName="border-none p-0 bg-transparent hover:bg-transparent w-auto h-auto"
    />
  );
});
