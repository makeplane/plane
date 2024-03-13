import { FC } from "react";
import Link from "next/link";
// helpers
import { cn } from "helpers/common.helper";

type TPageTabNavigation = {
  workspaceSlug: string;
  projectId: string;
  pageType: "public" | "private" | "archived";
};

// pages tab options
const pageTabs = [
  {
    key: "public",
    label: "Public",
  },
  {
    key: "private",
    label: "Private",
  },
  {
    key: "archived",
    label: "Archived",
  },
];

export const PageTabNavigation: FC<TPageTabNavigation> = (props) => {
  const { workspaceSlug, projectId, pageType } = props;

  return (
    <div className="relative flex items-center">
      {pageTabs.map((tab) => (
        <Link key={tab.key} href={`/${workspaceSlug}/projects/${projectId}/pages?type=${tab.key}`}>
          <div>
            <div
              className={cn(`p-3 py-4 text-sm font-medium transition-all`, {
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
  );
};
