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

  // Prepend sentinel "All workspaces" option so user can deselect workspace
  const options = [
    {
      value: "",
      query: t("ho.all_workspaces"),
      content: (
        <div className="flex items-center gap-2 max-w-[250px]">
          <Building2 className="h-4 w-4 flex-shrink-0 text-custom-text-300" />
          <span className="truncate text-custom-text-300">{t("ho.all_workspaces")}</span>
        </div>
      ),
    },
    ...store.accessibleWorkspaces.map((ws) => ({
      value: ws.slug,
      query: ws.name,
      content: (
        <div className="flex items-center gap-2 max-w-[250px]">
          <Building2 className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{ws.name}</span>
        </div>
      ),
    })),
  ];

  const selectedName = store.selectedWorkspaceSlug
    ? store.accessibleWorkspaces.find((w) => w.slug === store.selectedWorkspaceSlug)?.name
    : null;

  return (
    <CustomSearchSelect
      value={store.selectedWorkspaceSlug ?? ""}
      onChange={(val: string) => store.setWorkspaceFilter(val || null)}
      options={options}
      className="border-none p-0"
      customButton={
        <div className={cn(getButtonStyling("secondary", "lg"), "gap-2")}>
          <Building2 className="h-4 w-4" />
          {selectedName ?? t("ho.all_workspaces")}
          <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
        </div>
      }
      customButtonClassName="border-none p-0 bg-transparent hover:bg-transparent w-auto h-auto"
    />
  );
});
