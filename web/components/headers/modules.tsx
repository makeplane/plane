import { Dispatch, FC, SetStateAction } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Plus } from "lucide-react";
// components
import { Breadcrumbs, BreadcrumbItem } from "components/breadcrumbs";
// ui
import { Button, Tooltip } from "@plane/ui";
import { Icon } from "components/ui";
// helper
import { replaceUnderscoreIfSnakeCase, truncateText } from "helpers/string.helper";

export interface IModulesHeader {
  name: string | undefined;
  modulesView: string;
  setModulesView: Dispatch<SetStateAction<"grid" | "gantt_chart">>;
}

const moduleViewOptions: { type: "grid" | "gantt_chart"; icon: any }[] = [
  {
    type: "gantt_chart",
    icon: "view_timeline",
  },
  {
    type: "grid",
    icon: "table_rows",
  },
];

export const ModulesHeader: FC<IModulesHeader> = (props) => {
  const { name, modulesView, setModulesView } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div
      className={`relative flex w-full flex-shrink-0 flex-row z-10 items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4`}
    >
      <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
        <div className="block md:hidden">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded border border-custom-border-200"
            onClick={() => router.back()}
          >
            <ArrowLeft fontSize={14} strokeWidth={2} />
          </button>
        </div>
        <div>
          <Breadcrumbs>
            <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
            <BreadcrumbItem title={`${truncateText(name ?? "Project", 32)} Cycles`} />
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
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none hover:bg-custom-sidebar-background-80 duration-300 ${
                modulesView === option.type ? "bg-custom-sidebar-background-80" : "text-custom-sidebar-text-200"
              }`}
              onClick={() => setModulesView(option.type)}
            >
              <Icon iconName={option.icon} className={`!text-base ${option.type === "grid" ? "rotate-90" : ""}`} />
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
};
