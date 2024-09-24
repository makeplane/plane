import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { observer } from "mobx-react";
//hooks
import { TSelectionHelper } from "@/hooks/use-multiple-select";
import { useTableKeyboardNavigation } from "@/hooks/use-table-keyboard-navigation";
// components
import { IProjectDisplayProperties } from "@/plane-web/constants/project/spreadsheet";
import { TProject } from "@/plane-web/types/projects";
import { TProjectDisplayFilters } from "@/plane-web/types/workspace-project-filters";
import { SpreadsheetProjectRow } from "./project-row";
import { SpreadsheetHeader } from "./spreadsheet-header";

type Props = {
  displayFilters: TProjectDisplayFilters;
  handleDisplayFilterUpdate: (data: Partial<TProjectDisplayFilters>) => void;
  projectIds: string[];
  updateProject: ((projectId: string | null, data: Partial<TProject>) => Promise<TProject>) | undefined;
  canEditProperties: (projectId: string | undefined) => boolean;
  portalElement: React.MutableRefObject<HTMLDivElement | null>;
  containerRef: MutableRefObject<HTMLTableElement | null>;
  spreadsheetColumnsList: (keyof IProjectDisplayProperties)[];
  selectionHelpers: TSelectionHelper;
};

export const SpreadsheetTable = observer((props: Props) => {
  const {
    displayFilters,
    handleDisplayFilterUpdate,
    projectIds,
    portalElement,
    updateProject,
    canEditProperties,
    containerRef,
    spreadsheetColumnsList,
    selectionHelpers,
  } = props;

  // states
  const isScrolled = useRef(false);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;

    const columnShadow = "8px 22px 22px 10px rgba(0, 0, 0, 0.05)"; // shadow for regular columns
    const headerShadow = "8px -22px 22px 10px rgba(0, 0, 0, 0.05)"; // shadow for headers

    //The shadow styles are added this way to avoid re-render of all the rows of table, which could be costly
    if (scrollLeft > 0 !== isScrolled.current) {
      const firstColumns = containerRef.current.querySelectorAll("table tr td:first-child, th:first-child");

      for (let i = 0; i < firstColumns.length; i++) {
        const shadow = i === 0 ? headerShadow : columnShadow;
        if (scrollLeft > 0) {
          (firstColumns[i] as HTMLElement).style.boxShadow = shadow;
        } else {
          (firstColumns[i] as HTMLElement).style.boxShadow = "none";
        }
      }
      isScrolled.current = scrollLeft > 0;
    }
  }, [containerRef]);

  useEffect(() => {
    const currentContainerRef = containerRef.current;

    if (currentContainerRef) currentContainerRef.addEventListener("scroll", handleScroll);

    return () => {
      if (currentContainerRef) currentContainerRef.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll, containerRef]);

  const handleKeyBoardNavigation = useTableKeyboardNavigation();

  return (
    <table className="overflow-y-auto bg-custom-background-100" onKeyDown={handleKeyBoardNavigation}>
      <SpreadsheetHeader
        displayFilters={displayFilters}
        handleDisplayFilterUpdate={handleDisplayFilterUpdate}
        canEditProperties={canEditProperties}
        spreadsheetColumnsList={spreadsheetColumnsList}
        selectionHelpers={selectionHelpers}
      />
      <tbody>
        {projectIds.map((id) => (
          <SpreadsheetProjectRow
            key={id}
            projectId={id}
            canEditProperties={canEditProperties}
            nestingLevel={0}
            updateProject={updateProject}
            portalElement={portalElement}
            containerRef={containerRef}
            isScrolled={isScrolled}
            spreadsheetColumnsList={spreadsheetColumnsList}
            selectionHelpers={selectionHelpers}
          />
        ))}
      </tbody>
    </table>
  );
});
