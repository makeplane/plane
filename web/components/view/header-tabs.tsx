import { FC, Fragment, ReactNode, useMemo } from "react";
import Link from "next/link";
import { Briefcase, CheckCircle, ChevronRight } from "lucide-react";
// hooks
import { useProject } from "hooks/store";
// types
import { TViewTypes } from "@plane/types";

type TViewHeader = {
  projectId: string | undefined;
  viewType: TViewTypes;
  titleIcon: ReactNode;
  title: string;
  workspaceViewTabOptions: { key: TViewTypes; title: string; href: string }[];
};

export const ViewHeader: FC<TViewHeader> = (props) => {
  const { projectId, viewType, titleIcon, title, workspaceViewTabOptions } = props;
  // hooks
  const { getProjectById } = useProject();

  const projectDetails = useMemo(
    () => (projectId ? getProjectById(projectId) : undefined),
    [projectId, getProjectById]
  );

  return (
    <div className="relative flex items-center gap-2">
      {projectDetails && (
        <Fragment>
          <div className="relative flex items-center gap-2 overflow-hidden">
            <div className="flex-shrink-0 w-6 h-6 rounded relative flex justify-center items-center bg-custom-background-80">
              {projectDetails?.icon_prop ? projectDetails?.icon_prop.toString() : <Briefcase size={12} />}
            </div>
            <div className="font-medium inline-block whitespace-nowrap overflow-hidden truncate line-clamp-1 text-sm">
              {projectDetails?.name ? projectDetails?.name : "Project Issues"}
            </div>
          </div>
          <div className="text-custom-text-200">
            <ChevronRight size={12} />
          </div>
        </Fragment>
      )}

      <div className="relative flex items-center gap-2 overflow-hidden">
        <div className="flex-shrink-0 w-6 h-6 rounded relative flex justify-center items-center bg-custom-background-80">
          {titleIcon ? titleIcon : <CheckCircle size={12} />}
        </div>
        <div className="font-medium inline-block whitespace-nowrap overflow-hidden truncate line-clamp-1 text-sm">
          {title ? title : "All Issues"}
        </div>
      </div>

      <div className="ml-auto relative flex items-center gap-3">
        <div className="relative flex items-center rounded border border-custom-border-200 bg-custom-background-80">
          {workspaceViewTabOptions.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`p-4 py-1.5 rounded text-sm transition-all cursor-pointer font-medium
                ${
                  viewType === tab.key
                    ? "text-custom-text-100 bg-custom-background-100"
                    : "text-custom-text-200 bg-custom-background-80 hover:text-custom-text-100"
                }`}
            >
              {tab.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
