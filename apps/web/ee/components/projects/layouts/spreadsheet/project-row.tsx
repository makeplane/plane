"use client";

import { MutableRefObject, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
// ui
import { Tooltip } from "@plane/ui";
// components
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
// constants
// helper
import { cn } from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { TSelectionHelper } from "@/hooks/use-multiple-select";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local components
import { IProjectDisplayProperties } from "@/plane-web/constants/project/spreadsheet";
import { TProject } from "@/plane-web/types/projects";
import { ProjectColumn } from "./project-column";

interface Props {
  canEditProperties: (projectId: string | undefined) => boolean;
  updateProject: ((projectId: string | null, data: Partial<TProject>) => Promise<TProject>) | undefined;
  portalElement: React.MutableRefObject<HTMLDivElement | null>;
  nestingLevel: number;
  projectId: string;
  isScrolled: MutableRefObject<boolean>;
  containerRef: MutableRefObject<HTMLTableElement | null>;
  spreadsheetColumnsList: (keyof IProjectDisplayProperties)[];
  spacingLeft?: number;
  selectionHelpers: TSelectionHelper;
}

export const SpreadsheetProjectRow = observer((props: Props) => {
  const {
    projectId,
    portalElement,
    updateProject,
    canEditProperties,
    isScrolled,
    containerRef,
    spreadsheetColumnsList,
    selectionHelpers,
  } = props;

  return (
    <>
      {/* first column/ project name and key column */}
      <RenderIfVisible
        as="tr"
        defaultHeight="calc(2.75rem - 1px)"
        root={containerRef}
        placeholderChildren={
          <td colSpan={100} className="border-[0.5px] border-transparent border-b-custom-border-200" />
        }
        classNames={cn("bg-custom-background-100 transition-[background-color]")}
        verticalOffset={100}
      >
        <ProjectRowDetails
          projectId={projectId}
          canEditProperties={canEditProperties}
          updateProject={updateProject}
          portalElement={portalElement}
          isScrolled={isScrolled}
          spreadsheetColumnsList={spreadsheetColumnsList}
          selectionHelpers={selectionHelpers}
        />
      </RenderIfVisible>
    </>
  );
});

interface ProjectRowDetailsProps {
  canEditProperties: (projectId: string | undefined) => boolean;
  updateProject: ((projectId: string | null, data: Partial<TProject>) => Promise<TProject>) | undefined;
  portalElement: React.MutableRefObject<HTMLDivElement | null>;

  projectId: string;
  isScrolled: MutableRefObject<boolean>;
  spreadsheetColumnsList: (keyof IProjectDisplayProperties)[];
  spacingLeft?: number;
  selectionHelpers: TSelectionHelper;
}

const ProjectRowDetails = observer((props: ProjectRowDetailsProps) => {
  const { projectId, updateProject, canEditProperties, isScrolled, spreadsheetColumnsList } = props;
  // refs
  const cellRef = useRef(null);
  // router
  const { workspaceSlug } = useParams();
  const router = useRouter();
  // hooks
  const { getProjectById } = useProject();

  const { isMobile } = usePlatformOS();

  const projectDetails = getProjectById(projectId);

  if (!projectDetails) return null;

  const disableUserActions = !canEditProperties(projectId ?? undefined);

  return (
    <>
      <td
        id={`project-${projectId}`}
        ref={cellRef}
        tabIndex={0}
        className="sticky left-0 z-10 group/list-block bg-custom-background-100"
      >
        <Link
          href={`/${workspaceSlug}/projects/${projectId}/issues`}
          className={cn(
            "group clickable cursor-pointer h-11 w-[28rem] flex items-center text-sm after:absolute border-r-[0.5px] z-10 border-custom-border-200 bg-transparent group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10",
            {
              "border-b-[0.5px]": true,

              "shadow-[8px_22px_22px_10px_rgba(0,0,0,0.05)]": isScrolled.current,
            }
          )}
          onClick={() => {
            router.push(`/${workspaceSlug}/projects/${projectId}/issues`);
          }}
        >
          <div className="flex items-center gap-2 justify-between h-full w-full pr-4 pl-4 truncate">
            <div className="w-full line-clamp-1 text-sm text-custom-text-100">
              <div className="w-full overflow-hidden">
                <Tooltip tooltipContent={projectDetails.name} isMobile={isMobile}>
                  <div
                    className="h-full w-full cursor-pointer truncate pr-4 text-left text-[0.825rem] text-custom-text-100 focus:outline-none flex gap-5"
                    tabIndex={-1}
                  >
                    <span className="text-custom-text-300  w-[60px] text-xs self-center">
                      {projectDetails.identifier}
                    </span>
                    <span className="max-w-[300px] truncate"> {projectDetails.name}</span>
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>
        </Link>
      </td>
      {/* Rest of the columns */}
      {spreadsheetColumnsList.map((property) => (
        <ProjectColumn
          key={property}
          projectDetails={projectDetails}
          disableUserActions={disableUserActions}
          property={property}
          updateProject={updateProject}
        />
      ))}
    </>
  );
});
