"use client";

// helpers
import { renderFullDate } from "helpers/date-time.helper";

export const dueDateIconDetails = (
  date: string,
  stateGroup: string
): {
  iconName: string;
  className: string;
} => {
  let iconName = "calendar_today";
  let className = "";

  if (!date || ["completed", "cancelled"].includes(stateGroup)) {
    iconName = "calendar_today";
    className = "";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const timeDifference = targetDate.getTime() - today.getTime();

    if (timeDifference < 0) {
      iconName = "event_busy";
      className = "text-red-500";
    } else if (timeDifference === 0) {
      iconName = "today";
      className = "text-red-500";
    } else if (timeDifference === 24 * 60 * 60 * 1000) {
      iconName = "event";
      className = "text-yellow-500";
    } else {
      iconName = "calendar_today";
      className = "";
    }
  }

  return {
    iconName,
    className,
  };
};

export const IssueBlockDueDate = ({ due_date, group }: { due_date: string; group: string }) => {
  const iconDetails = dueDateIconDetails(due_date, group);

  return (
    <div className="rounded flex px-2.5 py-1 items-center border-[0.5px] border-custom-border-300 gap-1 text-custom-text-100 text-xs">
      <span className={`material-symbols-rounded text-sm -my-0.5 ${iconDetails.className}`}>
        {iconDetails.iconName}
      </span>
      {renderFullDate(due_date)}
    </div>
  );
};
