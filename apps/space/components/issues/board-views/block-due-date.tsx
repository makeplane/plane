"use client";

// helpers
import { renderFullDate } from "constants/helpers";

export const findHowManyDaysLeft = (date: string | Date) => {
  const today = new Date();
  const eventDate = new Date(date);
  const timeDiff = Math.abs(eventDate.getTime() - today.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

const validDate = (date: any, state: string): string => {
  if (date === null || ["backlog", "unstarted", "cancelled"].includes(state))
    return `bg-gray-500/10 text-gray-500 border-gray-500/50`;
  else {
    const today = new Date();
    const dueDate = new Date(date);

    if (dueDate < today) return `bg-red-500/10 text-red-500 border-red-500/50`;
    else return `bg-green-500/10 text-green-500 border-green-500/50`;
  }
};

export const IssueBlockDueDate = ({ due_date, state }: any) => (
  <div
    className={`rounded flex px-2.5 py-1 items-center border-[0.5px] border-custom-border-100 gap-1 text-custom-text-100 text-xs ${validDate(
      due_date,
      state
    )}`}
  >
    {renderFullDate(due_date)}
  </div>
);
