import { observer } from "mobx-react";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@plane/i18n";
import { EstimatePropertyIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
import type { TTimeEntry, TTimeEntryEditableFields } from "@plane/types";
import { TimeEntryService } from "@/services/issue/time_entry.service";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { Button, Input, Spinner } from "@plane/ui";
import { PlayIcon, Square, PlusIcon, TrashIcon, ClockIcon, AlertCircleIcon } from "lucide-react";
import { useTimer } from "@/hooks/store/use-timer";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

const formatTimer = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const TimeTrackingProperty = observer(function TimeTrackingProperty(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  const { t } = useTranslation();
  const timerStore = useTimer();
  const { issue: { getIssueById } } = useIssueDetail();
  const issue = getIssueById(issueId);
  
  const [timeEntries, setTimeEntries] = useState<TTimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<TTimeEntryEditableFields>>({
    description: "",
  });
  const [hours, setHours] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("");
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const timeEntryService = new TimeEntryService();
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Force re-render when timer updates
  useEffect(() => {
    if (timerStore.isTimerRunning) {
      updateIntervalRef.current = setInterval(() => {
        setForceUpdate((prev) => prev + 1);
      }, 1000);
    } else {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [timerStore.isTimerRunning]);

  // Fetch time entries
  const fetchTimeEntries = async () => {
    try {
      setIsLoading(true);
      const entries = await timeEntryService.fetchTimeEntries(workspaceSlug, projectId, issueId);
      setTimeEntries(entries);
    } catch (error) {
      console.error("Failed to fetch time entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeEntries();
  }, [workspaceSlug, projectId, issueId]);

  const handleStartTimer = async () => {
    // If there's an active timer on another issue, stop it first
    if (timerStore.isTimerRunning && !timerStore.isTimerForIssue(issueId)) {
      const { elapsedSeconds, savedTimer } = timerStore.stopTimer();
      // Save the previous timer entry
      if (savedTimer && elapsedSeconds > 0) {
        try {
          await timeEntryService.createTimeEntry(
            savedTimer.workspaceSlug,
            savedTimer.projectId,
            savedTimer.issueId,
            {
              time_spent: elapsedSeconds,
              description: "",
              is_timer: true,
              started_at: new Date(savedTimer.startTime).toISOString(),
              ended_at: new Date().toISOString(),
            }
          );
        } catch (error) {
          console.error("Failed to save previous timer entry:", error);
        }
      }
    }
    timerStore.startTimer(issueId, projectId, workspaceSlug);
  };

  const handleStopTimer = async () => {
    if (!timerStore.isTimerRunning || !timerStore.isTimerForIssue(issueId)) return;
    
    const { elapsedSeconds, savedTimer } = timerStore.stopTimer();
    if (elapsedSeconds > 0 && savedTimer) {
      try {
        await timeEntryService.createTimeEntry(workspaceSlug, projectId, issueId, {
          time_spent: elapsedSeconds,
          description: "",
          is_timer: true,
          started_at: new Date(savedTimer.startTime).toISOString(),
          ended_at: new Date().toISOString(),
        });
        await fetchTimeEntries();
      } catch (error) {
        console.error("Failed to save time entry:", error);
      }
    }
  };

  const handleAddManualEntry = async () => {
    const totalSeconds = (parseFloat(hours) || 0) * 3600 + (parseFloat(minutes) || 0) * 60;
    if (totalSeconds > 0) {
      try {
        await timeEntryService.createTimeEntry(workspaceSlug, projectId, issueId, {
          time_spent: totalSeconds,
          description: newEntry.description || "",
          is_timer: false,
        });
        await fetchTimeEntries();
        setShowAddForm(false);
        setNewEntry({ description: "" });
        setHours("");
        setMinutes("");
      } catch (error) {
        console.error("Failed to create time entry:", error);
      }
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm(t("common.confirm_delete") || "Are you sure you want to delete this time entry?")) {
      return;
    }
    try {
      await timeEntryService.deleteTimeEntry(workspaceSlug, projectId, issueId, entryId);
      await fetchTimeEntries();
    } catch (error) {
      console.error("Failed to delete time entry:", error);
    }
  };

  const isTimerRunningForThisIssue = timerStore.isTimerRunning && timerStore.isTimerForIssue(issueId);
  const isTimerRunningElsewhere = timerStore.isTimerRunning && !timerStore.isTimerForIssue(issueId);
  const currentTimerSeconds = isTimerRunningForThisIssue ? timerStore.activeTimerSeconds : 0;
  const totalTime = timeEntries.reduce((sum, entry) => sum + entry.time_spent, 0) + currentTimerSeconds;

  if (disabled) {
    return (
      <SidebarPropertyListItem icon={EstimatePropertyIcon} label={t("common.time_tracking") || "Time Tracking"}>
        <div className="flex items-center gap-2">
          <ClockIcon className="h-3.5 w-3.5 text-tertiary" />
          <span className="text-body-xs-medium text-secondary">{formatTime(totalTime)}</span>
        </div>
      </SidebarPropertyListItem>
    );
  }

  return (
    <SidebarPropertyListItem icon={EstimatePropertyIcon} label={t("common.time_tracking") || "Time Tracking"}>
      <div className="flex flex-col gap-3 w-full">
        {/* Active Timer Warning (if running elsewhere) */}
        {isTimerRunningElsewhere && timerStore.activeTimer && (
          <div className="flex items-center gap-2 p-2 rounded-md border border-warning-strong/20 bg-warning-1/10">
            <AlertCircleIcon className="h-3.5 w-3.5 text-warning-strong shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-11 font-medium text-warning-strong">
                {t("common.timer_running_elsewhere") || "Timer running on another issue"}
              </p>
              <p className="text-10 text-warning-strong/80 truncate">
                {formatTimer(timerStore.activeTimerSeconds)}
              </p>
            </div>
            <Button
              variant="neutral-primary"
              size="sm"
              onClick={handleStartTimer}
              prependIcon={<Square className="h-3 w-3" />}
            >
              {t("common.switch") || "Switch"}
            </Button>
          </div>
        )}

        {/* Timer Section */}
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-subtle bg-layer-1">
          <div className="flex items-center gap-2 flex-1">
            {isTimerRunningForThisIssue ? (
              <>
                <div className={cn(
                  "flex items-center gap-2 px-2.5 py-1 rounded bg-accent-1/10 border border-accent-1/20"
                )}>
                  <div className="h-2 w-2 rounded-full bg-accent-1 animate-pulse shrink-0" />
                  <span className="text-body-xs-medium font-mono text-accent-1 tabular-nums">
                    {formatTimer(currentTimerSeconds)}
                  </span>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleStopTimer}
                  prependIcon={<Square className="h-3 w-3" />}
                >
                  {t("common.stop") || "Stop"}
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartTimer}
                disabled={disabled}
                prependIcon={<PlayIcon className="h-3 w-3" />}
                className="flex-1"
              >
                {t("common.start_timer") || "Start Timer"}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-layer-2 border border-subtle">
            <ClockIcon className="h-3.5 w-3.5 text-tertiary shrink-0" />
            <span className="text-body-xs-medium font-semibold text-secondary tabular-nums">
              {formatTime(totalTime)}
            </span>
          </div>
        </div>

        {/* Add Manual Entry Form */}
        {showAddForm ? (
          <div className="flex flex-col gap-2.5 p-3 rounded-md border border-subtle bg-layer-1">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-11 font-medium text-tertiary mb-1 block">
                  {t("common.hours") || "Hours"}
                </label>
                <Input
                  type="number"
                  mode="primary"
                  inputSize="sm"
                  placeholder="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  min="0"
                  step="0.5"
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="text-11 font-medium text-tertiary mb-1 block">
                  {t("common.minutes") || "Minutes"}
                </label>
                <Input
                  type="number"
                  mode="primary"
                  inputSize="sm"
                  placeholder="0"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  min="0"
                  max="59"
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="text-11 font-medium text-tertiary mb-1 block">
                {t("common.description") || "Description"}
              </label>
              <Input
                type="text"
                mode="primary"
                inputSize="sm"
                placeholder={t("common.description_placeholder") || "What did you work on?"}
                value={newEntry.description || ""}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddManualEntry}
                className="flex-1"
                disabled={!hours && !minutes}
              >
                {t("common.add") || "Add"}
              </Button>
              <Button
                variant="neutral-primary"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewEntry({ description: "" });
                  setHours("");
                  setMinutes("");
                }}
              >
                {t("common.cancel") || "Cancel"}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="w-full"
            prependIcon={<PlusIcon className="h-3 w-3" />}
          >
            {t("common.add_time") || "Add Time Manually"}
          </Button>
        )}

        {/* Time Entries List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner className="h-4 w-4" />
          </div>
        ) : timeEntries.length > 0 ? (
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {timeEntries.map((entry) => (
              <div
                key={entry.id}
                className="group flex items-start justify-between gap-2 p-2.5 rounded-md border border-subtle bg-layer-1 hover:bg-layer-2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-body-xs-medium font-semibold text-secondary tabular-nums">
                      {formatTime(entry.time_spent)}
                    </span>
                    {entry.is_timer && (
                      <span className="px-1.5 py-0.5 rounded text-10 font-medium bg-accent-1/10 text-accent-1 border border-accent-1/20">
                        {t("common.timer") || "Timer"}
                      </span>
                    )}
                  </div>
                  {entry.description && (
                    <p className="text-body-xs-regular text-tertiary line-clamp-2 mb-1">
                      {entry.description}
                    </p>
                  )}
                  {entry.created_at && (
                    <span className="text-10 text-quaternary">
                      {formatDate(entry.created_at)}
                    </span>
                  )}
                </div>
                <Button
                  variant="neutral-primary"
                  size="sm"
                  onClick={() => handleDeleteEntry(entry.id)}
                  prependIcon={<TrashIcon className="h-3 w-3" />}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <ClockIcon className="h-8 w-8 text-quaternary mb-2" />
            <p className="text-body-xs-regular text-tertiary">
              {t("common.no_time_entries") || "No time entries yet"}
            </p>
            <p className="text-11 text-quaternary mt-1">
              {t("common.start_tracking_time") || "Start tracking your time"}
            </p>
          </div>
        )}
      </div>
    </SidebarPropertyListItem>
  );
});
