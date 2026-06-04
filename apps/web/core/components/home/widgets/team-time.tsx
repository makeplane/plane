import React, { useState, useMemo, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { format, isSameWeek, isSameMonth, isSameYear, parseISO, startOfDay } from "date-fns";
import { Users, Download, ChevronRight, FileX } from "lucide-react";
// ui
import { ModalCore } from "@plane/ui";
import { Avatar } from "@plane/ui";
// services
import { IssueTimerService } from "@/services/issue/issue_timer.service";
import type { TIssueTimerAdmin } from "@plane/types";
import { API_BASE_URL, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { WorkspaceService } from "@/services/workspace.service";

const timerService = new IssueTimerService();
const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
};

type TRange = "week" | "month" | "year";

// Self-ticking duration display — only this <span> re-renders every second, not the whole widget
const LiveDuration = React.memo(({ timer, getLiveDuration, formatTime }: {
  timer: any;
  getLiveDuration: (t: any) => number;
  formatTime: (s: number) => string;
}) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <>{formatTime(getLiveDuration(timer))}</>;
});

export const TeamTimeWidget = observer(({ workspaceSlug }: Props) => {
  const [range, setRange] = useState<TRange>("week");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { allowPermissions } = useUserPermissions();

  const isAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug
  );

  // Fetch timers only if admin
  const { data: timers = [], isLoading } = useSWR(
    isAdmin && workspaceSlug ? `ADMIN_TIMERS_${workspaceSlug}` : null,
    () => timerService.getAdminTimers(workspaceSlug),
    { revalidateOnFocus: true }
  );

  if (!isAdmin) return null;

  const { data: workspaceMembers = [] } = useSWR(
    isAdmin && workspaceSlug ? `WORKSPACE_MEMBERS_${workspaceSlug}` : null,
    () => workspaceService.fetchWorkspaceMembers(workspaceSlug),
    { revalidateOnFocus: false }
  );

  const { data: activeTimers = [] } = useSWR(
    isAdmin && workspaceSlug ? `ACTIVE_TIMERS_${workspaceSlug}` : null,
    () => timerService.getActiveTimers(workspaceSlug),
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  // Filter timers based on selected range
  const filteredTimers = useMemo(() => {
    const now = new Date();
    return timers.filter((t) => {
      if (!t.started_at) return false;
      const started = parseISO(t.started_at);
      if (range === "week") return isSameWeek(started, now, { weekStartsOn: 1 });
      if (range === "month") return isSameMonth(started, now);
      if (range === "year") return isSameYear(started, now);
      return false;
    });
  }, [timers, range]);

  const calculateMergedDuration = useCallback((timers: any[], dayStartMs?: number) => {
    const intervals: { start: number; end: number }[] = [];
    const nowUtc = new Date().getTime();
    const dayEndMs = dayStartMs ? dayStartMs + 24 * 60 * 60 * 1000 : Infinity;

    timers.forEach((t) => {
      if (t.segments && t.segments.length > 0) {
        t.segments.forEach((seg: any) => {
          if (!seg.segment_start) return;
          const start = new Date(seg.segment_start).getTime();
          const end = seg.segment_end ? new Date(seg.segment_end).getTime() : nowUtc;
          let cStart = start;
          let cEnd = end;
          if (dayStartMs) {
             cStart = Math.max(start, dayStartMs);
             cEnd = Math.min(end, dayEndMs);
          }
          if (cStart < cEnd) {
             intervals.push({ start: cStart, end: cEnd });
          }
        });
      } else {
        if (t.started_at) {
          const start = new Date(t.started_at).getTime();
          const end = t.stopped_at
            ? new Date(t.stopped_at).getTime()
            : start + (t.total_duration_seconds || 0) * 1000;
          let cStart = start;
          let cEnd = end;
          if (dayStartMs) {
             cStart = Math.max(start, dayStartMs);
             cEnd = Math.min(end, dayEndMs);
          }
          if (cStart < cEnd) {
             intervals.push({ start: cStart, end: cEnd });
          }
        }
      }
    });

    if (intervals.length === 0) return 0;
    intervals.sort((a, b) => a.start - b.start);

    let totalMs = 0;
    let currentStart = intervals[0].start;
    let currentEnd = intervals[0].end;

    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i].start <= currentEnd) {
        currentEnd = Math.max(currentEnd, intervals[i].end);
      } else {
        totalMs += currentEnd - currentStart;
        currentStart = intervals[i].start;
        currentEnd = intervals[i].end;
      }
    }
    totalMs += currentEnd - currentStart;

    return Math.floor(totalMs / 1000);
  }, []);

  const getLiveDuration = useCallback((timer: any, dayStartMs?: number) => {
    return calculateMergedDuration([timer], dayStartMs);
  }, [calculateMergedDuration]);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const hasRunningTimers = timers.some((t) => t.is_running || activeTimers.length > 0);
    if (!hasRunningTimers) return;

    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timers, activeTimers]);

  // Aggregate by user
  const userStats = useMemo(() => {
    const stats: Record<string, { id: string; name: string; total: number; timers: any[]; activeTimer: any | null }> = {};
    
    workspaceMembers.forEach((m: any) => {
      const uid = m.member?.id;
      if (uid) {
        stats[uid] = { 
          id: uid, 
          name: m.member?.display_name || m.member?.email || "Unknown", 
          total: 0, 
          timers: [],
          activeTimer: null
        };
      }
    });

    activeTimers.forEach((at: any) => {
      if (stats[at.user_id]) {
        stats[at.user_id].activeTimer = at;
      }
    });

    filteredTimers.forEach((t) => {
      if (!stats[t.user_id]) {
        stats[t.user_id] = { id: t.user_id, name: t.user_display_name, total: 0, timers: [], activeTimer: null };
      }
      stats[t.user_id].timers.push(t);
    });

    // Compute union of time for each user
    Object.values(stats).forEach(u => {
      u.total = calculateMergedDuration(u.timers);
    });
    
    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [filteredTimers, workspaceMembers, activeTimers, calculateMergedDuration, tick]);

  const selectedUserStats = useMemo(() => {
    if (!selectedUser) return null;
    return userStats.find((u) => u.id === selectedUser);
  }, [selectedUser, userStats]);

  const formatTime = useCallback((secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const handleExport = (userId?: string) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let url = `${API_BASE_URL}/api/workspaces/${workspaceSlug}/timers/admin/export/?tz=${tz}`;
    if (userId) {
      url += `&user_id=${userId}`;
    }
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.download = userId ? `team_time_export_${userId}.csv` : "team_time_export_all.csv";
    anchor.click();
  };

  return (
    <>
      <div className="flex flex-col rounded-lg border border-custom-border-200 bg-custom-background-100 shadow-sm mt-4">
        <div className="flex items-center justify-between border-b border-custom-border-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-custom-text-200" />
            <h3 className="text-sm font-semibold text-custom-text-100">Team Time</h3>
          </div>
          <div className="flex items-center gap-1 rounded bg-custom-background-90 p-1">
            {(["week", "month", "year"] as TRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  range === r
                    ? "bg-custom-background-100 text-custom-text-100 shadow-sm"
                    : "text-custom-text-300 hover:text-custom-text-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-2">
          {isLoading ? (
            <div className="animate-pulse space-y-4 py-4">
              <div className="h-8 w-full rounded bg-custom-background-90" />
              <div className="h-8 w-full rounded bg-custom-background-90" />
            </div>
          ) : userStats.length === 0 ? (
             <p className="text-xs text-custom-text-400 py-4">
               No team members have logged time this {range}.
             </p>
          ) : (
            <div className="flex flex-col divide-y divide-custom-border-100">
              {userStats.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3 min-w-0 gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative">
                      <Avatar name={u.name} />
                      {u.activeTimer ? (
                        <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-custom-background-100 animate-pulse" title="Active" />
                      ) : (
                        <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-gray-400 border-2 border-custom-background-100" title="Inactive" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-custom-text-100 truncate">{u.name}</span>
                      {u.activeTimer ? (
                        <span className="text-xs text-custom-primary-100 truncate">
                          {u.activeTimer.issue_title || "Active"} · <LiveDuration timer={u.activeTimer} getLiveDuration={getLiveDuration} formatTime={formatTime} />
                        </span>
                      ) : (
                        <span className="text-xs text-custom-text-400">No active timer</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(u.id)}
                    className="group flex items-center gap-2 text-sm font-mono font-medium text-custom-text-200 hover:text-custom-primary-100 transition-colors flex-shrink-0"
                    type="button"
                  >
                    {formatTime(u.total)}
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              ))}
              {userStats.length > 5 && (
                 <div className="py-3 text-center">
                    <span className="text-xs text-custom-text-300">And {userStats.length - 5} more... View all in Time Reports.</span>
                 </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ModalCore
        isOpen={!!selectedUser}
        handleClose={() => setSelectedUser(null)}
        className="max-h-[85vh] w-full max-w-4xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-custom-border-200 px-6 py-4 bg-custom-background-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-custom-text-100">
            {selectedUserStats?.name}'s Working Hours ({range})
          </h2>
          <button
            onClick={() => handleExport(selectedUser!)}
            className="flex items-center gap-2 rounded bg-custom-background-90 border border-custom-border-300 px-3 py-1.5 text-xs font-medium text-custom-text-100 hover:bg-custom-background-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-custom-background-90 p-6">
          {!selectedUserStats || selectedUserStats.timers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileX className="w-12 h-12 text-custom-text-400 mb-4" />
              <h3 className="text-sm font-medium text-custom-text-200">No time logged</h3>
              <p className="text-xs text-custom-text-400 mt-1">There are no timer records for this {range}.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(Object.values(
                selectedUserStats.timers.reduce((acc: Record<string, { date: Date; total: number; timers: TIssueTimerAdmin[] }>, t) => {
                  const daySet = new Set<string>();
                  const nowUtc = new Date().getTime();

                  if (t.segments && t.segments.length > 0) {
                     t.segments.forEach((seg: any) => {
                        if (!seg.segment_start) return;
                        const start = new Date(seg.segment_start).getTime();
                        const end = seg.segment_end ? new Date(seg.segment_end).getTime() : nowUtc;
                        let currentDt = new Date(start);
                        while (currentDt.getTime() < end) {
                           const day = startOfDay(currentDt);
                           daySet.add(day.toISOString());
                           const nextDay = new Date(day);
                           nextDay.setDate(nextDay.getDate() + 1);
                           currentDt = new Date(Math.min(end, nextDay.getTime()));
                           if (currentDt.getTime() === end && currentDt.getTime() === nextDay.getTime()) break;
                        }
                     });
                  } else if (t.started_at) {
                     daySet.add(startOfDay(parseISO(t.started_at)).toISOString());
                  }

                  daySet.forEach(dateStr => {
                     if (!acc[dateStr]) acc[dateStr] = { date: parseISO(dateStr), total: 0, timers: [] };
                     acc[dateStr].timers.push(t);
                  });
                  return acc;
                }, {})
              ) as { date: Date; total: number; timers: TIssueTimerAdmin[] }[]).sort((a, b) => b.date.getTime() - a.date.getTime()).map((group) => (
                <div key={group.date.toISOString()} className="rounded-lg border border-custom-border-200 bg-custom-background-100 overflow-hidden">
                  <div className="flex items-center justify-between bg-custom-background-90 px-4 py-2 border-b border-custom-border-200">
                    <span className="text-sm font-medium text-custom-text-100">
                      {format(group.date, "EEEE, MMMM d, yyyy")}
                    </span>
                    <span className="text-sm font-mono font-medium text-custom-text-200">
                      {formatTime(calculateMergedDuration(group.timers, group.date.getTime()))}
                    </span>
                  </div>
                  <div className="divide-y divide-custom-border-100">
                    {group.timers.map((timer) => (
                      <div key={timer.id} className="grid grid-cols-12 gap-4 px-4 py-3 text-sm items-center">
                        <div className="col-span-2 text-custom-text-300 truncate min-w-0" title={timer.issue_identifier}>
                          {timer.issue_identifier}
                        </div>
                        <div className="col-span-3 text-custom-text-100 font-medium truncate min-w-0" title={timer.issue_name}>
                          {timer.issue_name}
                        </div>
                        <div className="col-span-2 text-custom-text-300 truncate min-w-0" title={timer.project_name}>
                          {timer.project_name}
                        </div>
                        <div className="col-span-2 text-custom-text-200 font-mono text-right min-w-0">
                          {timer.is_running && !timer.is_paused ? <LiveDuration timer={timer} getLiveDuration={(t) => getLiveDuration(t, group.date.getTime())} formatTime={formatTime} /> : formatTime(getLiveDuration(timer, group.date.getTime()))}
                        </div>
                        <div className="col-span-3 text-custom-text-400 italic text-xs flex items-center justify-between gap-2 min-w-0">
                          <span className="truncate" title={timer.note || undefined}>{timer.note || "-"}</span>
                          {timer.is_manual && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-custom-background-80 border border-custom-border-200 text-custom-text-300">
                              Manual
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between border-t border-custom-border-200 px-6 py-4 bg-custom-background-100 flex-shrink-0">
          <span className="text-sm font-medium text-custom-text-300">Grand Total</span>
          <span className="text-lg font-bold font-mono text-custom-text-100">
            {formatTime(selectedUserStats?.total || 0)}
          </span>
        </div>
      </ModalCore>
    </>
  );
});
