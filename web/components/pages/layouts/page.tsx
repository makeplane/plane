import { FC, ReactNode } from "react";
import Link from "next/link";
// components
import { PageSearchInput } from "../";
// helpers
import { cn } from "helpers/common.helper";

type TPageLayout = {
  workspaceSlug: string;
  projectId: string;
  pageType?: "private" | "public";
  children: ReactNode;
};

export const PageLayout: FC<TPageLayout> = (props) => {
  const { workspaceSlug, projectId, pageType, children } = props;

  // pages tab options
  const pageTabs = [
    {
      key: "private",
      label: "Private",
    },
    {
      key: "public",
      label: "Public",
    },
  ];

  // pages list loader

  // check for empty state

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      {/* tab header */}
      <div className="flex-shrink-0 w-full relative flex items-center border-b border-custom-border-200 px-3">
        {pageTabs.map((tab) => (
          <Link key={tab.key} href={`/${workspaceSlug}/projects/${projectId}/pages?pageType=${tab.key}`}>
            <div className="">
              <div
                className={cn(`p-3 text-sm font-medium transition-all`, {
                  "text-custom-primary-100": tab.key === pageType,
                })}
              >
                {tab.label}
              </div>
              <div
                className={cn(`rounded-t border-t-2 transition-all`, {
                  "border-custom-primary-100": tab.key === pageType,
                  "border-transparent": tab.key !== pageType,
                })}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* search and sort container */}
      <div className="flex-shrink-0 w-full relative flex justify-between items-center p-3">
        <div>
          <PageSearchInput projectId={projectId} />
        </div>
        <div>Sort filter</div>
      </div>

      {/* children */}
      <div className="w-full h-full overflow-hidden">{children}</div>
    </div>
  );
};
