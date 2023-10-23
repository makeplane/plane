import * as React from "react";

import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
// ui
import { Breadcrumbs, BreadcrumbItem, Button } from "@plane/ui";
// helpers
import { truncateText } from "helpers/string.helper";

export interface ICyclesHeader {
  name: string | undefined;
}

export const CyclesHeader: React.FC<ICyclesHeader> = (props) => {
  const { name } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div
      className={`relative z-10 flex w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4`}
    >
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
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
