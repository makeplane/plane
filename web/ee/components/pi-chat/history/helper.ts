import { TUserThreads } from "@/plane-web/types";

// Function to group threads by date ranges dynamically
export const groupThreadsByDate = (threads: TUserThreads[]) => {
  const groupedThreads: Record<string, TUserThreads[]> = {};

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  threads.forEach((thread) => {
    const threadDate = new Date(thread.last_modified);
    // Group by today
    if (threadDate.toDateString() === today.toDateString()) {
      if (!groupedThreads["today"]) {
        groupedThreads["today"] = [];
      }
      groupedThreads["today"].push(thread);
    }
    // Group by yesterday
    else if (threadDate.toDateString() === yesterday.toDateString()) {
      if (!groupedThreads["yesterday"]) {
        groupedThreads["yesterday"] = [];
      }
      groupedThreads["yesterday"].push(thread);
    }
    // Group by specific date (e.g., previous days)
    else {
      const dateKey = threadDate.toISOString().split("T")[0]; // Get date in YYYY-MM-DD format
      if (!groupedThreads[dateKey]) {
        groupedThreads[dateKey] = [];
      }
      groupedThreads[dateKey].push(thread);
    }
  });

  return groupedThreads;
};
