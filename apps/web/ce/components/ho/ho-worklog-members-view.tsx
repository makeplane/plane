import { ChevronRight, Loader2 } from "lucide-react";
import { Avatar } from "@plane/propel/avatar";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import type { THoWorklogMember } from "@/plane-web/services/ho-issue.service";
import { formatLogTime } from "./ho-worklog-helpers";

type Props = {
  totalMinutes: number;
  members: THoWorklogMember[];
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  hasNext: boolean;
  error: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  onSelectMember: (m: THoWorklogMember) => void;
  t: (key: string) => string;
};

export function HoWorklogMembersView({
  totalMinutes,
  members,
  isInitialLoading,
  isLoadingMore,
  hasNext,
  error,
  onLoadMore,
  onRetry,
  onSelectMember,
  t,
}: Props) {
  return (
    <div
      className="p-3 text-left animate-in fade-in duration-200 ease-out"
      role="region"
      aria-label={t("worklog.title")}
    >
      <div className="mb-2 flex items-center justify-between border-b border-subtle pb-2">
        <span className="text-11 font-medium text-tertiary uppercase tracking-wide">{t("worklog.total")}</span>
        <span className="text-13 font-semibold text-primary tabular-nums">{formatLogTime(totalMinutes)}</span>
      </div>
      <p className="mb-1.5 px-1 text-11 font-medium text-tertiary uppercase tracking-wide">{t("worklog.member")}</p>

      {isInitialLoading ? (
        <LoadingSpinner />
      ) : error && members.length === 0 ? (
        <ErrorState t={t} onRetry={onRetry} />
      ) : members.length === 0 ? (
        <p className="px-1 py-4 text-center text-11 text-tertiary">{t("worklog.no_entries")}</p>
      ) : (
        <div className="max-h-72 space-y-0.5 overflow-y-auto" aria-live="polite">
          {members.map((m) => (
            <button
              key={m.user_id}
              type="button"
              onClick={() => onSelectMember(m)}
              className={cn(
                "group flex w-full items-center justify-between gap-3 rounded px-1.5 py-1.5 text-left",
                "transition-colors duration-150 hover:bg-layer-1",
                "focus-visible:bg-layer-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-strong"
              )}
              aria-label={`${m.display_name}, ${formatLogTime(m.total_minutes)}`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Avatar name={m.display_name} src={m.avatar_url} size="sm" shape="circle" />
                <Tooltip tooltipContent={m.display_name}>
                  <span className="truncate text-11 text-primary">{m.display_name}</span>
                </Tooltip>
              </div>
              <span className="flex flex-shrink-0 items-center gap-1 text-11 text-secondary tabular-nums">
                {formatLogTime(m.total_minutes)}
                <ChevronRight className="h-3 w-3 text-tertiary transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
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
          {error && members.length > 0 && (
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

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-tertiary" />
    </div>
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
