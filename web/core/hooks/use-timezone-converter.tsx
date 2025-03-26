import { format } from "date-fns";
import { useProject, useUser } from "@/hooks/store";

export const useTimeZoneConverter = (projectId: string) => {
  const { data: user } = useUser();
  const { getProjectById } = useProject();
  const userTimezone = user?.user_timezone;
  const projectTimezone = getProjectById(projectId)?.timezone;

  return {
    renderFormattedDateInUserTimezone: (date: string, formatToken: string = "MMM dd, yyyy") => {
      // return if undefined
      if (!date || !userTimezone) return;
      // convert the date to the user's timezone
      const convertedDate = new Date(date).toLocaleString("en-US", { timeZone: userTimezone });
      // return the formatted date
      return format(convertedDate, formatToken);
    },
    getProjectUTCOffset: () => {
      if (!projectTimezone) return;

      // Get date in user's timezone
      const projectDate = new Date(new Date().toLocaleString("en-US", { timeZone: projectTimezone }));
      const utcDate = new Date(new Date().toLocaleString("en-US", { timeZone: "UTC" }));

      // Calculate offset in minutes
      const offsetInMinutes = (projectDate.getTime() - utcDate.getTime()) / 60000;

      // return if undefined
      if (!offsetInMinutes) return;

      // Convert to hours and minutes
      const hours = Math.floor(Math.abs(offsetInMinutes) / 60);
      const minutes = Math.abs(offsetInMinutes) % 60;

      // Format as +/-HH:mm
      const sign = offsetInMinutes >= 0 ? "+" : "-";
      return `UTC ${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    },
    isProjectTimeZoneDifferent: () => {
      if (!projectTimezone || !userTimezone) return false;
      return projectTimezone !== userTimezone;
    },
  };
};
