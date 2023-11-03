import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { GanttChartSquare, LayoutGrid, List, Plus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// ui
import { Breadcrumbs, BreadcrumbItem, Button, Tooltip } from "@plane/ui";
// helper
import { truncateText } from "helpers/string.helper";

const MODULE_VIEW_LAYOUTS: { key: "list" | "grid" | "gantt_chart"; icon: any; title: string }[] = [
  {
    key: "list",
    icon: List,
    title: "List layout",
  },
  {
    key: "grid",
    icon: LayoutGrid,
    title: "Grid layout",
  },
  {
    key: "gantt_chart",
    icon: GanttChartSquare,
    title: "Gantt layout",
  },
];

export const ModulesListHeader: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const { project: projectStore } = useMobxStore();
  const { currentProjectDetails } = projectStore;

  const { storedValue: modulesView, setValue: setModulesView } = useLocalStorage("modules_view", "grid");

  return (
    <div
      className={`relative z-10 flex w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4`}
    >
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
          <Breadcrumbs onBack={() => router.back()}>
            <BreadcrumbItem
              link={
                <Link href={`/${workspaceSlug}/projects`}>
                  <a className={`border-r-2 border-custom-sidebar-border-200 px-3 text-sm `}>
                    <p>Projects</p>
                  </a>
                </Link>
              }
            />
            <BreadcrumbItem title={`${truncateText(currentProjectDetails?.name ?? "Project", 32)} Modules`} />
          </Breadcrumbs>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 rounded bg-custom-background-80">
          {MODULE_VIEW_LAYOUTS.map((layout) => (
            <Tooltip key={layout.key} tooltipContent={layout.title}>
              <button
                type="button"
                className={`w-7 h-[22px] rounded grid place-items-center transition-all hover:bg-custom-background-100 overflow-hidden group ${
                  modulesView == layout.key ? "bg-custom-background-100 shadow-custom-shadow-2xs" : ""
                }`}
                onClick={() => setModulesView(layout.key)}
              >
                <layout.icon
                  strokeWidth={2}
                  className={`h-3.5 w-3.5 ${
                    modulesView == layout.key ? "text-custom-text-100" : "text-custom-text-200"
                  }`}
                />
              </button>
            </Tooltip>
          ))}
        </div>
        <Button
          variant="primary"
          prependIcon={<Plus />}
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "m" });
            document.dispatchEvent(e);
          }}
        >
          Add Module
        </Button>
      </div>
    </div>
  );
});
