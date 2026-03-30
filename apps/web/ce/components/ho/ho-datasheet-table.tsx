import type { THoIssue } from "@/plane-web/services/ho-issue.service";
import type { THoDisplayProperties } from "@/plane-web/store/ho/ho-issue.store";
import { HoDatasheetHeader } from "./ho-datasheet-header";
import { HoDatasheetRow } from "./ho-datasheet-row";

type Props = {
  issues: THoIssue[];
  displayProperties: THoDisplayProperties;
  orderBy: string;
  onOrderBy: (key: string) => void;
};

export function HoDatasheetTable({ issues, displayProperties, orderBy, onOrderBy }: Props) {
  return (
    <div className="relative overflow-x-auto overflow-y-auto horizontal-scrollbar scrollbar-lg max-h-[calc(100vh-170px)]">
      <table className="w-full border-collapse text-left">
        <HoDatasheetHeader displayProperties={displayProperties} orderBy={orderBy} onOrderBy={onOrderBy} />
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
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
