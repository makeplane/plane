import { observer } from "mobx-react";
import { getButtonStyling } from "@plane/propel/button";
import { ChevronDownIcon, ProjectIcon } from "@plane/propel/icons";
import { CustomSearchSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import { useTranslation } from "@plane/i18n";
import { useHoIssues } from "@/hooks/store/use-ho-issues";

export const HoProjectSelect = observer(function HoProjectSelect() {
  const { t } = useTranslation();
  const store = useHoIssues();

  const workspace = store.accessibleWorkspaces.find((w) => w.id === store.selectedDepartmentId);

  if (!workspace) return null; // hidden when no workspace selected ("All Workspaces")

  const options = workspace.projects.map((p) => ({
    value: p.id,
    query: `${p.name} ${p.identifier}`,
    content: (
      <div className="flex items-center gap-2 max-w-[250px]">
        <ProjectIcon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{p.name}</span>
      </div>
    ),
  }));

  const label =
    store.selectedProjectIds.length > 3
      ? `3+ ${t("common.projects").toLowerCase()}`
      : store.selectedProjectIds.length > 0
        ? workspace.projects
            .filter((p) => store.selectedProjectIds.includes(p.id))
            .map((p) => p.name)
            .join(", ")
        : t("ho.all_projects");

  return (
    <CustomSearchSelect
      value={store.selectedProjectIds}
      onChange={(val: string[]) => store.setProjectFilter(val)}
      options={options}
      className="border-none p-0"
      customButton={
        <div className={cn(getButtonStyling("secondary", "lg"), "gap-2")}>
          <ProjectIcon className="h-4 w-4" />
          <span className="max-w-[200px] truncate">{label}</span>
          <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
        </div>
      }
      customButtonClassName="border-none p-0 bg-transparent hover:bg-transparent w-auto h-auto"
      multiple
    />
  );
});
