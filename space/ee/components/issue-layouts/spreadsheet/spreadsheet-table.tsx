import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// types
import { IIssueDisplayProperties } from "@plane/types";
// components
import { getDisplayPropertiesCount } from "@/components/issues/issue-layouts/utils";
//hooks
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useViewIssues } from "@/plane-web/hooks/store/use-view-issues";
//
import { SpreadsheetIssueRow } from "./issue-row";
import { SpreadsheetHeader } from "./spreadsheet-header";

type Props = {
  displayProperties: IIssueDisplayProperties;
  issueIds: string[];
  containerRef: MutableRefObject<HTMLTableElement | null>;
  canLoadMoreIssues: boolean;
  loadMoreIssues: () => void;
  spreadsheetColumnsList: (keyof IIssueDisplayProperties)[];
};

const SpreadsheetIssueRowLoader = (props: { columnCount: number }) => (
  <tr className="border-b border-custom-border-200 bg-custom-background-100">
    <td className="h-11 min-w-[28rem] z-[10] sticky left-0 flex items-center border-r-[0.5px] border-custom-border-200 bg-custom-background-100">
      <div className="flex items-center gap-3 px-3">
        <span className="h-5 w-10 bg-custom-background-80 rounded animate-pulse" />
        <span className={`h-5 w-52 bg-custom-background-80 rounded animate-pulse`} />
      </div>
    </td>
    {[...Array(props.columnCount)].map((_, colIndex) => (
      <td key={colIndex} className="h-11 w-full min-w-[8rem] border-r border-custom-border-200 ">
        <div className="flex items-center justify-center gap-3 px-3">
          <span className="h-5 w-20 bg-custom-background-80 rounded animate-pulse" />
        </div>
      </td>
    ))}
  </tr>
);

export const SpreadsheetTable = observer((props: Props) => {
  const { displayProperties, issueIds, canLoadMoreIssues, containerRef, loadMoreIssues, spreadsheetColumnsList } =
    props;

  // states
  const isScrolled = useRef(false);
  const [intersectionElement, setIntersectionElement] = useState<HTMLTableSectionElement | null>(null);

  const { getIssueLoader } = useViewIssues();

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

  const isPaginating = !!getIssueLoader();

  useIntersectionObserver(containerRef, isPaginating ? null : intersectionElement, loadMoreIssues, `100% 0% 100% 0%`);

  const ignoreFieldsForCounting: (keyof IIssueDisplayProperties)[] = ["key", "estimate"];
  const displayPropertiesCount = getDisplayPropertiesCount(displayProperties, ignoreFieldsForCounting);

  return (
    <table className="overflow-y-auto bg-custom-background-100">
      <SpreadsheetHeader displayProperties={displayProperties} spreadsheetColumnsList={spreadsheetColumnsList} />
      <tbody>
        {issueIds.map((id) => (
          <SpreadsheetIssueRow
            key={id}
            issueId={id}
            displayProperties={displayProperties}
            isScrolled={isScrolled}
            spreadsheetColumnsList={spreadsheetColumnsList}
          />
        ))}
      </tbody>
      {canLoadMoreIssues && (
        <tfoot ref={setIntersectionElement}>
          <SpreadsheetIssueRowLoader columnCount={displayPropertiesCount} />
        </tfoot>
      )}
    </table>
  );
});
