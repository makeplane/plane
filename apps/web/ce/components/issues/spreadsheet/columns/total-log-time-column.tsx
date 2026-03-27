import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import { Avatar } from "@plane/propel/avatar";
import { Popover } from "@plane/propel/popover";
import { Row } from "@plane/ui";
import { useWorklog } from "@/hooks/store/use-worklog";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: Record<string, unknown>) => void;
  disabled: boolean;
};

function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null || minutes === 0) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

const ROW_CLASS =
  "flex h-11 w-full items-center border-b-[0.5px] border-subtle px-2 text-11 hover:bg-layer-1 group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10";

export const SpreadsheetTotalLogTimeColumn = observer(function SpreadsheetTotalLogTimeColumn({ issue }: Props) {
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const { t } = useTranslation();
  const worklogStore = useWorklog();
  const [isOpen, setIsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const formatted = formatMinutes(issue.total_logged_minutes);
  const hasLogs = !!issue.total_logged_minutes && issue.total_logged_minutes > 0;

  // Aggregate worklogs by user
  const worklogs = worklogStore.getWorklogsForIssue(issue.id);
  const userTotals = Object.values(
    worklogs.reduce<Record<string, { display_name: string; avatar_url: string; total_minutes: number }>>((acc, wl) => {
      const uid = wl.logged_by;
      if (!acc[uid]) {
        acc[uid] = {
          display_name: wl.logged_by_detail?.display_name ?? uid,
          avatar_url: wl.logged_by_detail?.avatar_url ?? "",
          total_minutes: 0,
        };
      }
      acc[uid].total_minutes += wl.duration_minutes;
      return acc;
    }, {})
  );

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    // Lazy-fetch worklogs on first open (only if not already cached)
    if (open && worklogs.length === 0 && workspaceSlug && issue.project_id) {
      setIsFetching(true);
      try {
        await worklogStore.fetchWorklogs(workspaceSlug, issue.project_id, issue.id);
      } finally {
        setIsFetching(false);
      }
    }
  };

  if (!hasLogs) {
    return (
      <Row className={`${ROW_CLASS} cursor-default`}>
        <span className="text-secondary">{formatted}</span>
      </Row>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={(open) => void handleOpenChange(open)}>
      <Popover.Button
        render={
          <Row className={`${ROW_CLASS} cursor-pointer`}>
            <span className="text-accent-primary">{formatted}</span>
          </Row>
        }
      />
      <Popover.Panel
        side="bottom"
        align="start"
        className="z-20 min-w-52 rounded-md border border-subtle bg-surface-1 shadow-lg"
      >
        <div className="p-2">
          <p className="mb-1.5 px-1 text-11 font-medium text-tertiary">{t("worklog.member")}</p>
          {isFetching ? (
            <p className="px-1 py-2 text-11 text-tertiary">{t("loading")}</p>
          ) : userTotals.length === 0 ? (
            <p className="px-1 py-2 text-11 text-tertiary">{t("worklog.no_entries")}</p>
          ) : (
            <div className="space-y-0.5">
              {userTotals.map((entry) => (
                <div
                  key={entry.display_name}
                  className="flex items-center justify-between gap-3 rounded px-1 py-1 hover:bg-layer-1"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar name={entry.display_name} src={entry.avatar_url} size="sm" shape="circle" />
                    <span className="truncate text-11 text-primary">{entry.display_name}</span>
                  </div>
                  <span className="flex-shrink-0 text-11 text-secondary">{formatMinutes(entry.total_minutes)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Popover.Panel>
    </Popover>
  );
});
