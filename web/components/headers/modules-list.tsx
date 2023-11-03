import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { GanttChartSquare, LayoutGrid, List, Plus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// ui
import { Breadcrumbs, Button, Tooltip, DiceIcon } from "@plane/ui";
// helper
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
import { renderEmoji } from "helpers/emoji.helper";

const moduleViewOptions: { type: "list" | "grid" | "gantt_chart"; icon: any }[] = [
  {
    type: "list",
    icon: List,
  },
  {
    type: "grid",
    icon: LayoutGrid,
  },
  {
    type: "gantt_chart",
    icon: GanttChartSquare,
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
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              label={currentProjectDetails?.name ?? "Project"}
              icon={
                currentProjectDetails?.emoji ? (
                  renderEmoji(currentProjectDetails.emoji)
                ) : currentProjectDetails?.icon_prop ? (
                  renderEmoji(currentProjectDetails.icon_prop)
                ) : (
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                    {currentProjectDetails?.name.charAt(0)}
                  </span>
                )
              }
              link={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              icon={<DiceIcon className="h-4 w-4 text-custom-text-300" />}
              label="Modules"
            />
          </Breadcrumbs>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {moduleViewOptions.map((option) => (
          <Tooltip
            key={option.type}
            tooltipContent={<span className="capitalize">{replaceUnderscoreIfSnakeCase(option.type)} Layout</span>}
            position="bottom"
          >
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-sidebar-background-80 ${
                modulesView === option.type ? "bg-custom-sidebar-background-80" : "text-custom-sidebar-text-200"
              }`}
              onClick={() => setModulesView(option.type)}
            >
              <option.icon className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        ))}
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
