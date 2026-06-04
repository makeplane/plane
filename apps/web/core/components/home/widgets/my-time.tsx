import React, { useState, useMemo, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { format, isSameWeek, isSameMonth, isSameYear, parseISO, startOfDay } from "date-fns";
import { Clock, Download, ChevronRight, FileX } from "lucide-react";
// ui
import { ModalCore } from "@plane/ui";
// services
import { IssueTimerService } from "@/services/issue/issue_timer.service";
import type { TIssueTimerAdmin } from "@plane/types";
import { API_BASE_URL } from "@plane/constants";

const timerService = new IssueTimerService();

type Props = {
  workspaceSlug: string;
};

type TRange = "week" | "month" | "year";

export const MyTimeWidget = observer(({ workspaceSlug }: Props) => {
  const [range, setRange] = useState<TRange>("week");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch timers
  const { data: timers = [], isLoading, mutate } = useSWR(
    workspaceSlug ? `USER_TIMERS_${workspaceSlug}` : null,
    () => timerService.getUserTimers(workspaceSlug),
    { revalidateOnFocus: true }
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

  const calculateMergedDuration = useCallback((timers: TIssueTimerAdmin[], dayStartMs?: number) => {
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

  const [tick, setTick] = useState(0);

  // Group by date
  const groupedTimers = useMemo(() => {
    const groups: Record<string, { date: Date; total: number; timers: TIssueTimerAdmin[] }> = {};
    const nowUtc = new Date().getTime();
    
    filteredTimers.forEach((t) => {
      const daySet = new Set<string>();
      
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
         const day = startOfDay(parseISO(t.started_at));
         daySet.add(day.toISOString());
      }
      
      daySet.forEach(dateStr => {
         if (!groups[dateStr]) groups[dateStr] = { date: new Date(dateStr), total: 0, timers: [] };
         groups[dateStr].timers.push(t);
      });
    });

    Object.values(groups).forEach(g => {
      g.total = calculateMergedDuration(g.timers, g.date.getTime());
    });

    return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredTimers, calculateMergedDuration, tick]);

  useEffect(() => {
    const hasRunningTimers = timers.some((t) => t.is_running);
    if (!hasRunningTimers) return;

    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timers]);

  const getLiveDuration = useCallback((timer: TIssueTimerAdmin, dayStartMs?: number) => {
    return calculateMergedDuration([timer], dayStartMs);
  }, [calculateMergedDuration]);

  const grandTotal = useMemo(() => {
    // Recalculates dynamically as `tick` updates every second
    return calculateMergedDuration(filteredTimers);
  }, [filteredTimers, tick, calculateMergedDuration]);

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleExport = () => {
    // Determine local timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const url = `${API_BASE_URL}/api/workspaces/${workspaceSlug}/timers/me/export/?tz=${tz}`;
    // Fetch with credentials using standard browser behavior for downloading CSV
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.download = "my_time_export.csv";
    anchor.click();
  };

  // Find active timers (running or paused)
  const activeTimers = useMemo(() => {
    return timers.filter((t) => t.is_running || t.is_paused);
  }, [timers]);

  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const handleAction = async (timer: TIssueTimerAdmin, action: "pause" | "resume" | "stop") => {
    setIsActionLoading(timer.id);
    try {
      const updatedTimer = await timerService.actionTimer(workspaceSlug, timer.project_id, timer.issue_id, action);
      
      // Optimistic update to show real-time pause/play without refreshing
      mutate((currentTimers: any) => {
        if (!currentTimers) return currentTimers;
        return currentTimers.map((t: any) => (t.id === timer.id ? { ...t, ...updatedTimer } : t));
      }, false);

      // Revalidate in background to ensure complete data sync
      mutate();
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(null);
    }
  };

  return (
    <>
      <div className="flex flex-col rounded-lg border border-custom-border-200 bg-custom-background-100 shadow-sm">
        <div className="flex items-center justify-between border-b border-custom-border-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-custom-text-200" />
            <h3 className="text-sm font-semibold text-custom-text-100">My Time</h3>
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

        <div className="px-5 py-6 flex flex-col gap-6">
          {activeTimers.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold text-custom-text-300 uppercase tracking-wider">Active Timers</h4>
              {activeTimers.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-custom-border-200 bg-custom-background-90">
                  <div className="flex flex-col min-w-0 mr-4">
                    <span className="text-xs text-custom-text-300 truncate">{t.project_name}</span>
                    <span className="text-sm font-medium text-custom-text-100 truncate">{t.issue_name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-custom-background-100 rounded text-xs font-mono font-medium text-custom-text-200">
                      {t.is_running && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                      {t.is_paused && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                      {formatTime(getLiveDuration(t))}
                    </div>
                    <div className="flex items-center gap-1">
                      {t.is_paused ? (
                        <button
                          onClick={() => handleAction(t, "resume")}
                          disabled={isActionLoading === t.id}
                          className="p-1.5 text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-100 rounded transition-colors disabled:opacity-50"
                          title="Resume"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(t, "pause")}
                          disabled={isActionLoading === t.id}
                          className="p-1.5 text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-100 rounded transition-colors disabled:opacity-50"
                          title="Pause"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(t, "stop")}
                        disabled={isActionLoading === t.id}
                        className="p-1.5 text-custom-text-300 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                        title="Stop"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-8 w-32 rounded bg-custom-background-90" />
              <div className="h-4 w-48 rounded bg-custom-background-90" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="group flex flex-col gap-1 text-left w-full rounded-md p-2 -ml-2 hover:bg-custom-background-90 transition-colors"
              >
                <div className="flex items-center text-xs font-semibold text-custom-text-300 uppercase tracking-wider">
                  Total Logged This {range} <ChevronRight className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-custom-primary-100" />
                </div>
                <span className="text-4xl font-bold font-mono text-custom-text-100 group-hover:text-custom-primary-100 transition-colors tracking-tight">
                  {formatTime(grandTotal)}
                </span>
              </button>
              {filteredTimers.length === 0 && (
                <p className="text-xs text-custom-text-400 mt-2">
                  You haven't logged any time this {range}. Start a timer on an issue to see it here.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <ModalCore
        isOpen={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        className="max-h-[85vh] w-full max-w-4xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-custom-border-200 px-6 py-4 bg-custom-background-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-custom-text-100">My Working Hours ({range})</h2>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded bg-custom-background-90 border border-custom-border-300 px-3 py-1.5 text-xs font-medium text-custom-text-100 hover:bg-custom-background-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-custom-background-90 p-6">
          {groupedTimers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileX className="w-12 h-12 text-custom-text-400 mb-4" />
              <h3 className="text-sm font-medium text-custom-text-200">No time logged</h3>
              <p className="text-xs text-custom-text-400 mt-1">There are no timer records for this {range}.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedTimers.map((group) => (
                <div key={group.date.toISOString()} className="rounded-lg border border-custom-border-200 bg-custom-background-100 overflow-hidden">
                  <div className="flex items-center justify-between bg-custom-background-90 px-4 py-2 border-b border-custom-border-200">
                    <span className="text-sm font-medium text-custom-text-100">
                      {format(group.date, "EEEE, MMMM d, yyyy")}
                    </span>
                    <span className="text-sm font-mono font-medium text-custom-text-200">
                      {formatTime(group.total)}
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
                          {formatTime(getLiveDuration(timer, group.date.getTime()))}
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
          <span className="text-lg font-bold font-mono text-custom-text-100">{formatTime(grandTotal)}</span>
        </div>
      </ModalCore>
    </>
  );
});
