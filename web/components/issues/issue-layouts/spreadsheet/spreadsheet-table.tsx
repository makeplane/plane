import { observer } from "mobx-react-lite";
import { MutableRefObject, useEffect, useRef } from "react";
//types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, TIssue } from "@plane/types";
import { EIssueActions } from "../types";
//components
import { SpreadsheetIssueRow } from "./issue-row";
import { SpreadsheetHeader } from "./spreadsheet-header";
import { useTableKeyboardNavigation } from "hooks/use-table-keyboard-navigation";

type Props = {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  issueIds: string[];
  isEstimateEnabled: boolean;
  quickActions: (
    issue: TIssue,
    customActionButton?: React.ReactElement,
    portalElement?: HTMLDivElement | null
  ) => React.ReactNode;
  handleIssues: (issue: TIssue, action: EIssueActions) => Promise<void>;
  canEditProperties: (projectId: string | undefined) => boolean;
  portalElement: React.MutableRefObject<HTMLDivElement | null>;
  containerRef: MutableRefObject<HTMLTableElement | null>;
};

export const SpreadsheetTable = observer((props: Props) => {
  const {
    displayProperties,
    displayFilters,
    handleDisplayFilterUpdate,
    issueIds,
    isEstimateEnabled,
    portalElement,
    quickActions,
    handleIssues,
    canEditProperties,
    containerRef,
  } = props;

  // states
  const isScrolled = useRef(false);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;

    const columnShadow = "8px 22px 22px 10px rgba(0, 0, 0, 0.05)"; // shadow for regular columns
    const headerShadow = "8px -22px 22px 10px rgba(0, 0, 0, 0.05)"; // shadow for headers

    //The shadow styles are added this way to avoid re-render of all the rows of table, which could be costly
    if (scrollLeft > 0 !== isScrolled.current) {
      const firtColumns = containerRef.current.querySelectorAll("table tr td:first-child, th:first-child");

      for (let i = 0; i < firtColumns.length; i++) {
        const shadow = i === 0 ? headerShadow : columnShadow;
        if (scrollLeft > 0) {
          (firtColumns[i] as HTMLElement).style.boxShadow = shadow;
        } else {
          (firtColumns[i] as HTMLElement).style.boxShadow = "none";
        }
      }
      isScrolled.current = scrollLeft > 0;
    }
  };

  useEffect(() => {
    const currentContainerRef = containerRef.current;

    if (currentContainerRef) currentContainerRef.addEventListener("scroll", handleScroll);

    return () => {
      if (currentContainerRef) currentContainerRef.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleKeyBoardNavigation = useTableKeyboardNavigation();

  return (
    <table className="overflow-y-auto" onKeyDown={handleKeyBoardNavigation}>
      <SpreadsheetHeader
        displayProperties={displayProperties}
        displayFilters={displayFilters}
        handleDisplayFilterUpdate={handleDisplayFilterUpdate}
        isEstimateEnabled={isEstimateEnabled}
      />
      <tbody>
        {issueIds.map((id) => (
          <SpreadsheetIssueRow
            key={id}
            issueId={id}
            displayProperties={displayProperties}
            quickActions={quickActions}
            canEditProperties={canEditProperties}
            nestingLevel={0}
            isEstimateEnabled={isEstimateEnabled}
            handleIssues={handleIssues}
            portalElement={portalElement}
            containerRef={containerRef}
            isScrolled={isScrolled}
            issueIds={issueIds}
          />
        ))}
      </tbody>
    </table>
  );
});
