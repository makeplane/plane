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

  const options = store.departmentOptions.map((dept) => ({
    value: dept.id,
    query: dept.name,
    content: (
      <div className="flex items-center gap-2 max-w-[250px]">
        <Building2 className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{dept.name}</span>
      </div>
    ),
  }));

  const selected = store.selectedDepartmentIds;
  const label =
    selected.length === 0
      ? t("ho.all_departments")
      : selected.length > 2
        ? `${selected.length} ${t("ho.departments_selected") ?? "departments"}`
        : store.departmentOptions
            .filter((d) => selected.includes(d.id))
            .map((d) => d.name)
            .join(", ");

  return (
    <CustomSearchSelect
      value={selected}
      onChange={(val: string[]) => store.setDepartmentFilter(val)}
      options={options}
      className="border-none p-0"
      customButton={
        <div className={cn(getButtonStyling("secondary", "lg"), "gap-2")}>
          <Building2 className="h-4 w-4" />
          <span className="max-w-[220px] truncate">{label}</span>
          <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
        </div>
      }
      customButtonClassName="border-none p-0 bg-transparent hover:bg-transparent w-auto h-auto"
      multiple
    />
  );
});
