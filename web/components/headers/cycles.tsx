import { FC } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Plus } from "lucide-react";
// components
import { Breadcrumbs, BreadcrumbItem } from "components/breadcrumbs";
// ui
import { Button } from "@plane/ui";
// helpers
import { truncateText } from "helpers/string.helper";

export interface ICyclesHeader {
  name: string | undefined;
}

export const CyclesHeader: FC<ICyclesHeader> = (props) => {
  const { name } = props;
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
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          prependIcon={<Plus />}
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "q" });
            document.dispatchEvent(e);
          }}
        >
          Add Cycle
        </Button>
      </div>
    </div>
  );
};
