"use client";

// helpers
import { renderFullDate } from "constants/helpers";

export const findHowManyDaysLeft = (date: string | Date) => {
  const today = new Date();
  const eventDate = new Date(date);
  const timeDiff = Math.abs(eventDate.getTime() - today.getTime());

  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

const dueDateIcon = (
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
    const dueDate = new Date(date);

    if (dueDate < today) {
      iconName = "event_busy";
      className = "text-red-500";
    } else if (dueDate > today) {
      iconName = "calendar_today";
      className = "";
    } else {
      iconName = "today";
      className = "text-red-500";
    }
  }

  return {
    iconName,
    className,
  };
};

export const IssueBlockDueDate = ({ due_date, group }: { due_date: string; group: string }) => {
  const iconDetails = dueDateIcon(due_date, group);

  return (
    <div className="rounded flex px-2.5 py-1 items-center border-[0.5px] border-custom-border-300 gap-1 text-custom-text-100 text-xs">
      <span className={`material-symbols-rounded text-sm -my-0.5 ${iconDetails.className}`}>
        {iconDetails.iconName}
      </span>
      {renderFullDate(due_date)}
    </div>
  );
};
