import { useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Avatar } from "@plane/propel/avatar";
import { Skeleton } from "@plane/propel/skeleton";
import { cn } from "@plane/utils";
import type { THoWorklogByUserEntry, THoWorklogMember } from "@/plane-web/services/ho-issue.service";
import { formatLogTime } from "./ho-worklog-helpers";

type Props = {
  member: THoWorklogMember | null;
  entries: THoWorklogByUserEntry[];
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  hasNext: boolean;
  error: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  onBack: () => void;
  t: (key: string) => string;
};

export function HoWorklogUserDetailView({
  member,
  entries,
  isInitialLoading,
  isLoadingMore,
  hasNext,
  error,
  onLoadMore,
  onRetry,
  onBack,
  t,
}: Props) {
  const backBtnRef = useRef<HTMLButtonElement>(null);
  // Focus the Back button on mount so keyboard users can return immediately
  useEffect(() => {
    backBtnRef.current?.focus();
  }, []);

  const memberTotal = member?.total_minutes ?? 0;

  return (
    <div
      className="p-3 text-left animate-in fade-in slide-in-from-right-2 duration-150"
      role="region"
      aria-label={member?.display_name ?? t("worklog.work_items")}
    >
      <div className="mb-2 flex items-center gap-2 border-b border-subtle pb-2">
        <button
          ref={backBtnRef}
          type="button"
          onClick={onBack}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded transition-colors",
            "hover:bg-layer-1 focus-visible:bg-layer-1 focus-visible:outline-none",
            "focus-visible:ring-1 focus-visible:ring-accent-strong"
          )}
          aria-label={t("worklog.back")}
        >
          <ChevronLeft className="h-3.5 w-3.5 text-tertiary" />
        </button>
        {member && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Avatar name={member.display_name} src={member.avatar_url} size="sm" shape="circle" />
            <span className="truncate text-13 font-medium text-primary">{member.display_name}</span>
          </div>
        )}
        <span className="flex-shrink-0 text-11 font-semibold text-primary tabular-nums">
          {formatLogTime(memberTotal)}
        </span>
      </div>
      <p className="mb-1.5 px-1 text-11 font-medium text-tertiary uppercase tracking-wide">{t("worklog.work_items")}</p>

      {isInitialLoading ? (
        <EntriesSkeleton />
      ) : error && entries.length === 0 ? (
        <ErrorState t={t} onRetry={onRetry} />
      ) : entries.length === 0 ? (
        <p className="px-1 py-4 text-center text-11 text-tertiary">{t("worklog.no_entries")}</p>
      ) : (
        <div className="max-h-72 space-y-0.5 overflow-y-auto" aria-live="polite">
          {entries.map((e) => (
            <div
              key={e.issue_id}
              className="flex items-start justify-between gap-3 rounded px-1.5 py-1.5 transition-colors hover:bg-layer-1"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-11 text-primary">{e.issue_name}</p>
                {e.project_name && <p className="truncate text-10 text-tertiary">{e.project_name}</p>}
              </div>
              <span className="flex-shrink-0 text-11 text-secondary tabular-nums">
                {formatLogTime(e.total_minutes)}
              </span>
            </div>
          ))}

          {hasNext && (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className={cn(
                "mt-1 w-full rounded border border-subtle px-2 py-1.5 text-11 font-medium",
                "text-secondary hover:bg-layer-1 hover:text-primary",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-strong",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {isLoadingMore ? t("worklog.loading") : t("worklog.load_more")}
            </button>
          )}
          {error && entries.length > 0 && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 w-full rounded px-2 py-1.5 text-11 text-danger-primary hover:bg-danger-subtle"
            >
              {t("worklog.load_failed")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EntriesSkeleton() {
  return (
    <Skeleton className="space-y-1.5 px-1 py-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start justify-between gap-3 py-1">
          <div className="min-w-0 flex-1 space-y-1">
            <Skeleton.Item height="10px" width="160px" />
            <Skeleton.Item height="8px" width="100px" />
          </div>
          <Skeleton.Item height="10px" width="40px" />
        </div>
      ))}
    </Skeleton>
  );
}

function ErrorState({ t, onRetry }: { t: (k: string) => string; onRetry: () => void }) {
  return (
    <div className="px-1 py-4 text-center">
      <p className="mb-2 text-11 text-danger-primary">{t("worklog.load_failed")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded border border-subtle px-2 py-1 text-11 text-primary hover:bg-layer-1"
      >
        {t("worklog.retry")}
      </button>
    </div>
  );
}
