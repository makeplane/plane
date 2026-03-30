import { useRef, useState, useCallback, useEffect } from "react";
import type { THoIssue } from "@/plane-web/services/ho-issue.service";
import type { THoDisplayProperties } from "@/plane-web/store/ho/ho-issue.defaults";
import { HoDatasheetHeader } from "./ho-datasheet-header";
import { HoDatasheetRow } from "./ho-datasheet-row";

type Props = {
  issues: THoIssue[];
  displayProperties: THoDisplayProperties;
  orderBy: string;
  onOrderBy: (key: string) => void;
};

export function HoDatasheetTable({ issues, displayProperties, orderBy, onOrderBy }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;
    setIsScrolled(scrollLeft > 0);
  }, []);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (currentContainer) {
      currentContainer.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-x-auto overflow-y-auto horizontal-scrollbar scrollbar-lg max-h-[calc(100vh-170px)] bg-surface-1"
    >
      <table className="w-full border-collapse text-left">
        <HoDatasheetHeader
          displayProperties={displayProperties}
          orderBy={orderBy}
          onOrderBy={onOrderBy}
          isScrolled={isScrolled}
        />
        <tbody>
          {issues.map((issue, idx) => {
            const prev = idx > 0 ? issues[idx - 1] : null;
            const isNewDeptGroup = !prev || prev.department_name !== issue.department_name;
            const isNewProjectGroup = !isNewDeptGroup && !!prev && prev.project_name !== issue.project_name;
            return (
              <HoDatasheetRow
                key={issue.id}
                rowIndex={idx}
                issue={issue}
                displayProperties={displayProperties}
                isNewDeptGroup={isNewDeptGroup}
                isNewProjectGroup={isNewProjectGroup}
                isScrolled={isScrolled}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
