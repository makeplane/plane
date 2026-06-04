import React, { useState, useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { format, isSameWeek, isSameMonth, isSameYear, parseISO, startOfDay, differenceInDays } from "date-fns";
import { Download, Users, FileX, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, API_BASE_URL } from "@plane/constants";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { ModalCore, Avatar } from "@plane/ui";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// services
import { IssueTimerService } from "@/services/issue/issue_timer.service";
import { WorkspaceService } from "@/services/workspace.service";
import type { TIssueTimerAdmin } from "@plane/types";
// local
import { TimeReportsWorkspaceSettingsHeader } from "./header";

const timerService = new IssueTimerService();
const workspaceService = new WorkspaceService();
type TRange = "week" | "month" | "year";

function TimeReportsPage() {
  const { workspaceSlug } = useParams();
  const slug = workspaceSlug?.toString() ?? "";
  
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();

  const [range, setRange] = useState<TRange>("week");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.WORKSPACE
  );

  const { data: timers = [], isLoading } = useSWR(
    canPerformWorkspaceMemberActions && slug ? `ADMIN_TIMERS_${slug}` : null,
    () => timerService.getAdminTimers(slug),
    { revalidateOnFocus: true }
  );

  const { data: workspaceMembers = [] } = useSWR(
    canPerformWorkspaceMemberActions && slug ? `WORKSPACE_MEMBERS_${slug}` : null,
    () => workspaceService.fetchWorkspaceMembers(slug),
    { revalidateOnFocus: false }
  );

  const { data: activeTimers = [] } = useSWR(
    canPerformWorkspaceMemberActions && slug ? `ACTIVE_TIMERS_${slug}` : null,
    () => timerService.getActiveTimers(slug),
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  if (workspaceUserInfo && !canPerformWorkspaceMemberActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  // Filter timers
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

  const [tick, setTick] = useState(0);

  React.useEffect(() => {
    if (activeTimers.length === 0) return;
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimers]);

  const getLiveDuration = React.useCallback((timer: any) => {
    const isRunning = timer.is_running !== undefined ? (timer.is_running && !timer.is_paused) : true;
    if (!isRunning) return timer.computed_duration_seconds || timer.total_duration_seconds;
    
    let lastSegStart = timer.last_segment_start;
    if (!lastSegStart && timer.segments) {
       const openSeg = timer.segments.find((s: any) => !s.segment_end);
       if (openSeg) lastSegStart = openSeg.segment_start;
    }
    if (!lastSegStart) lastSegStart = timer.started_at;
    
    const startUtc = lastSegStart ? new Date(lastSegStart).getTime() : new Date().getTime();
    const nowUtc = new Date().getTime();
    
    return (timer.total_duration_seconds || 0) + Math.max(0, Math.floor((nowUtc - startUtc) / 1000));
  }, []);

  // Build user stats
  const userStats = useMemo(() => {
    const stats: Record<string, { id: string; name: string; total: number; daily: Record<string, number>; timers: any[]; activeTimer: any | null }> = {};
    
    workspaceMembers.forEach((m: any) => {
      const uid = m.member?.id;
      if (uid) {
        stats[uid] = { 
          id: uid, 
          name: m.member?.display_name || m.member?.email || "Unknown", 
          total: 0, 
          daily: {},
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
        stats[t.user_id] = { id: t.user_id, name: t.user_display_name, total: 0, daily: {}, timers: [], activeTimer: null };
      }
      stats[t.user_id].total += t.total_duration_seconds;
      stats[t.user_id].timers.push(t);

      // Aggregate daily for productivity indicator
      const dayKey = format(parseISO(t.started_at!), "yyyy-MM-dd");
      stats[t.user_id].daily[dayKey] = (stats[t.user_id].daily[dayKey] || 0) + t.total_duration_seconds;
    });

    Object.values(stats).forEach(u => {
      if (u.activeTimer) {
        const lastSegStart = u.activeTimer.last_segment_start || u.activeTimer.started_at;
        const startUtc = lastSegStart ? new Date(lastSegStart).getTime() : new Date().getTime();
        const delta = Math.max(0, Math.floor((new Date().getTime() - startUtc) / 1000));
        
        u.total += delta;
        // Also add live delta to today's daily aggregate if they are active
        const todayKey = format(new Date(), "yyyy-MM-dd");
        u.daily[todayKey] = (u.daily[todayKey] || 0) + delta;
      }
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [filteredTimers, workspaceMembers, activeTimers, tick]);

  const selectedUserStats = useMemo(() => {
    if (!selectedUser) return null;
    return userStats.find((u) => u.id === selectedUser);
  }, [selectedUser, userStats]);

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleExport = (userId?: string) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let url = `${API_BASE_URL}/api/workspaces/${slug}/timers/admin/export/?tz=${tz}`;
    if (userId) url += `&user_id=${userId}`;
    
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.download = userId ? `time_export_${userId}.csv` : "time_export_all.csv";
    anchor.click();
  };

  // Generate an array of dates for the current week or month to render CSS bars
  const productivityDays = useMemo(() => {
    if (range === "year") return [];
    const now = new Date();
    const days: Date[] = [];
    if (range === "week") {
      // 7 days
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1); // Monday
      for (let i = 0; i < 7; i++) {
        days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
      }
    } else if (range === "month") {
      // All days in month
      const maxDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= maxDays; i++) {
        days.push(new Date(now.getFullYear(), now.getMonth(), i));
      }
    }
    return days;
  }, [range]);

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - Time Reports`
    : "Time Reports";

  return (
    <SettingsContentWrapper header={<TimeReportsWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <div className="flex w-full flex-col gap-y-6">
        <div className="flex items-center justify-between">
          <SettingsHeading
            title="Time Reports"
            description="View and export time tracking reports for your workspace members."
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 rounded bg-custom-background-90 p-1 border border-custom-border-200">
              {(["week", "month", "year"] as TRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    range === r
                      ? "bg-custom-background-100 text-custom-text-100 shadow-sm"
                      : "text-custom-text-300 hover:text-custom-text-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleExport()}
              className="flex items-center gap-2 rounded bg-custom-background-90 border border-custom-border-300 px-4 py-2 text-sm font-medium text-custom-text-100 hover:bg-custom-background-100 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export All CSV
            </button>
          </div>
        </div>

        <div className="w-full border border-custom-border-200 rounded-md overflow-hidden bg-custom-background-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-custom-background-90 border-b border-custom-border-200">
              <tr>
                <th className="px-6 py-4 font-medium text-custom-text-200">Member</th>
                {range !== "year" && (
                  <th className="px-6 py-4 font-medium text-custom-text-200 w-64">Productivity</th>
                )}
                <th className="px-6 py-4 font-medium text-custom-text-200 text-right">Hours Logged</th>
                <th className="px-6 py-4 font-medium text-custom-text-200 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-custom-border-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-custom-text-400">Loading...</td>
                </tr>
              ) : userStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FileX className="h-10 w-10 text-custom-text-300 mb-3" />
                      <span className="text-custom-text-200 font-medium">No time logged</span>
                      <span className="text-custom-text-400 text-xs mt-1">There are no timer records for this {range}.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                userStats.map((u) => (
                  <tr key={u.id} className="group hover:bg-custom-background-90 transition-colors">
                    <td className="px-6 py-4">
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
                          <span className="font-medium text-custom-text-100 truncate">{u.name}</span>
                          {u.activeTimer ? (
                            <span className="text-xs text-custom-primary-100 truncate">
                              {u.activeTimer.issue_title || "Active"} · {formatTime(getLiveDuration(u.activeTimer))}
                            </span>
                          ) : (
                            <span className="text-xs text-custom-text-400">No active timer</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {range !== "year" && (
                      <td className="px-6 py-4">
                        <div className="flex items-end gap-0.5 h-8">
                          {productivityDays.map((d) => {
                            const dayKey = format(d, "yyyy-MM-dd");
                            const secs = u.daily[dayKey] || 0;
                            const hours = secs / 3600;
                            
                            // Height: max 12 hours = 100%
                            const heightPercent = Math.min(100, Math.max(5, (hours / 12) * 100));
                            
                            // Color logic: >=6h green, 3-6h yellow, <3h red
                            let colorClass = "bg-red-500/80";
                            if (hours >= 6) colorClass = "bg-green-500/80";
                            else if (hours >= 3) colorClass = "bg-yellow-500/80";
                            else if (hours === 0) colorClass = "bg-custom-background-80 border border-custom-border-200";

                            return (
                              <div
                                key={dayKey}
                                className={`w-full rounded-sm transition-all hover:opacity-80 ${colorClass}`}
                                style={{ height: hours === 0 ? "4px" : `${heightPercent}%` }}
                                title={`${format(d, "MMM d")}: ${formatTime(secs)}`}
                              />
                            );
                          })}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono font-medium text-custom-text-200">{formatTime(u.total)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedUser(u.id)}
                        className="text-custom-primary-100 hover:text-custom-primary-200 font-medium transition-colors flex-shrink-0"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(
                selectedUserStats.timers.reduce((acc, t) => {
                  const dateStr = startOfDay(parseISO(t.started_at!)).toISOString();
                  if (!acc[dateStr]) acc[dateStr] = { date: parseISO(dateStr), total: 0, timers: [] };
                  acc[dateStr].total += t.total_duration_seconds;
                  acc[dateStr].timers.push(t);
                  return acc;
                }, {} as Record<string, { date: Date; total: number; timers: TIssueTimerAdmin[] }>)
              ).sort((a, b) => b.date.getTime() - a.date.getTime()).map((group) => (
                <div key={group.date.toISOString()} className="rounded-lg border border-custom-border-200 bg-custom-background-100 overflow-hidden">
                  <div className="flex items-center justify-between bg-custom-background-90 px-4 py-2 border-b border-custom-border-200">
                    <span className="text-sm font-medium text-custom-text-100">
                      {format(group.date, "EEEE, MMMM d, yyyy")}
                    </span>
                    <span className="text-sm font-mono font-medium text-custom-text-200">
                      {formatTime(
                        group.total +
                        (selectedUserStats?.activeTimer && format(group.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                          ? Math.max(0, Math.floor((new Date().getTime() - new Date(selectedUserStats.activeTimer.last_segment_start || selectedUserStats.activeTimer.started_at).getTime()) / 1000))
                          : 0)
                      )}
                    </span>
                  </div>
                  <div className="divide-y divide-custom-border-100">
                    {group.timers.map((timer) => (
                      <div key={timer.id} className="grid grid-cols-12 gap-4 px-4 py-3 text-sm">
                        <div className="col-span-2 text-custom-text-300 truncate">
                          {timer.issue_identifier}
                        </div>
                        <div className="col-span-3 text-custom-text-100 font-medium truncate">
                          {timer.issue_name}
                        </div>
                        <div className="col-span-2 text-custom-text-300 truncate">
                          {timer.project_name}
                        </div>
                        <div className="col-span-2 text-custom-text-200 font-mono text-right truncate">
                          {formatTime(timer.is_running && !timer.is_paused ? getLiveDuration(timer) : timer.total_duration_seconds)}
                        </div>
                        <div className="col-span-3 text-custom-text-400 italic text-xs flex items-center justify-between gap-2 min-w-0">
                          <span className="truncate">{timer.note || "-"}</span>
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
    </SettingsContentWrapper>
  );
}

export default observer(TimeReportsPage);
