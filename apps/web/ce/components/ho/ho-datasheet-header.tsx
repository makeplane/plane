import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronsUpDown } from "lucide-react";
import { CustomMenu } from "@plane/ui";
import type { THoDisplayProperties } from "@/plane-web/store/ho/ho-issue.store";

// Map display property key → { label, orderByKey } for sortable columns
// "name" is a sentinel for the Work Items column (between sub_task_category and sub_issue_count)
const COL_META: Record<string, { label: string; asc?: string; desc?: string }> = {
  department_name: { label: "Department", asc: "project__workspace__name", desc: "-project__workspace__name" },
  project_name: { label: "Team / Project", asc: "project__name", desc: "-project__name" },
  main_task_category: {
    label: "Main Task Category",
    asc: "main_task_category__name",
    desc: "-main_task_category__name",
  },
  sub_task_category: { label: "Sub Task Category", asc: "sub_task_category__name", desc: "-sub_task_category__name" },
  name: { label: "Work Items" },
  sub_issue_count: { label: "Sub Items" },
  project_lead: { label: "Lead" },
  assignee: { label: "Assignee" },
  bank_wide_project: { label: "Bank-wide" },
  priority: { label: "Priority", asc: "priority", desc: "-priority" },
  state: { label: "Status", asc: "state__name", desc: "-state__name" },
  progress_tracking: { label: "Progress" },
  modules: { label: "Module" },
  cycle: { label: "Cycle" },
  start_date: { label: "Start Date", asc: "start_date", desc: "-start_date" },
  due_date: { label: "Due Date", asc: "target_date", desc: "-target_date" },
  completed_date: { label: "Completed" },
  total_log_time: { label: "Logtime" },
  reference_link: { label: "Links" },
};

const TH =
  "border-b border-subtle bg-surface-1 px-4 py-3 text-left text-12 font-medium text-secondary uppercase tracking-wide whitespace-nowrap";

type Props = {
  displayProperties: THoDisplayProperties;
  orderBy: string;
  onOrderBy: (key: string) => void;
};

export function HoDatasheetHeader({ displayProperties, orderBy, onOrderBy }: Props) {
  const renderTh = (key: string) => {
    const meta = COL_META[key];
    if (!meta) return null;
    const isSortable = !!(meta.asc || meta.desc);

    if (!isSortable) {
      return (
        <th key={key} className={TH}>
          {meta.label}
        </th>
      );
    }

    const isActive = orderBy === meta.asc || orderBy === meta.desc;
    const SortIcon =
      orderBy === meta.asc ? ArrowUpNarrowWide : orderBy === meta.desc ? ArrowDownWideNarrow : ChevronsUpDown;

    return (
      <th key={key} className={`${TH} cursor-pointer`}>
        <CustomMenu
          label={
            <span className={`flex items-center gap-1 ${isActive ? "text-accent-primary" : ""}`}>
              {meta.label}
              <SortIcon className="h-3 w-3" />
            </span>
          }
          buttonClassName="text-12 font-medium uppercase tracking-wide text-secondary"
          placement="bottom-start"
          closeOnSelect
        >
          {meta.asc && (
            <CustomMenu.MenuItem onClick={() => onOrderBy(meta.asc!)}>
              <span className="flex items-center gap-2">
                <ArrowUpNarrowWide className="h-3 w-3" /> Ascending
              </span>
            </CustomMenu.MenuItem>
          )}
          {meta.desc && (
            <CustomMenu.MenuItem onClick={() => onOrderBy(meta.desc!)}>
              <span className="flex items-center gap-2">
                <ArrowDownWideNarrow className="h-3 w-3" /> Descending
              </span>
            </CustomMenu.MenuItem>
          )}
          <CustomMenu.MenuItem onClick={() => onOrderBy("project__workspace__name")}>Clear sort</CustomMenu.MenuItem>
        </CustomMenu>
      </th>
    );
  };

  return (
    <thead>
      <tr>
        {/* "name" key always visible — not controlled by displayProperties */}
        {Object.keys(COL_META).map((key) =>
          key === "name" ? renderTh("name") : displayProperties[key] !== false && renderTh(key)
        )}
      </tr>
    </thead>
  );
}
