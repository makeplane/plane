import React, { useState } from "react";
import { observer } from "mobx-react";
import { format } from "date-fns";
import { ModalCore } from "@plane/ui";
import { IssueTimerService } from "@/services/issue/issue_timer.service";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";

const timerService = new IssueTimerService();

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueTitle?: string;
  onSuccess: () => void;
};

export const ManualTimeEntryModal = observer((props: Props) => {
  const { isOpen, onClose, workspaceSlug, projectId, issueId, issueTitle, onSuccess } = props;

  const [hours, setHours] = useState<number | "">("");
  const [minutes, setMinutes] = useState<number | "">("");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setHours("");
    setMinutes("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setNote("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    
    if (h < 0 || m < 0 || m > 59) return;
    const totalSeconds = (h * 3600) + (m * 60);
    
    if (totalSeconds <= 0) return;
    if (!date) return;

    setIsSubmitting(true);
    try {
      // Use the newly added manual action to create a distinct manual IssueTimer
      await timerService.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/timer/`, {
        action: "manual",
        duration: totalSeconds,
        date: new Date(date).toISOString(),
        note: note,
      });

      const displayTitle = issueTitle || issueId;
      const hoursText = h > 0 ? `${h}h ` : "";
      const minutesText = m > 0 ? `${m}m` : "";

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Time entry added",
        message: `${hoursText}${minutesText} logged on ${displayTitle}`,
      });
      onSuccess();
      handleClose();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to log time manually.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = (Number(hours) > 0 || Number(minutes) > 0) && Number(hours) >= 0 && Number(minutes) >= 0 && Number(minutes) <= 59 && !!date;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} className="w-full max-w-md">
      <div className="flex flex-col gap-4 p-6">
        <h3 className="text-lg font-semibold text-custom-text-100">Log Time Manually</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-custom-text-200">Hours</label>
              <input
                type="number"
                min="0"
                value={hours}
                onChange={(e) => setHours(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-md border border-custom-border-200 bg-custom-background-90 px-3 py-2 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 focus:outline-none"
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-custom-text-200">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-md border border-custom-border-200 bg-custom-background-90 px-3 py-2 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-custom-text-200">Date</label>
            <input
              type="date"
              value={date}
              required
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-custom-border-200 bg-custom-background-90 px-3 py-2 text-sm text-custom-text-100 focus:border-custom-primary-100 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-custom-text-200">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What did you work on?"
              className="w-full rounded-md border border-custom-border-200 bg-custom-background-90 px-3 py-2 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 focus:outline-none resize-none"
            />
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-custom-border-200 bg-custom-background-100 px-4 py-2 text-sm font-medium text-custom-text-200 hover:bg-custom-background-90"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-on-color hover:bg-accent-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </ModalCore>
  );
});
