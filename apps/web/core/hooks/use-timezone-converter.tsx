import { useCallback } from "react";
import { format } from "date-fns";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";

export const useTimeZoneConverter = (projectId: string) => {
  const { data: user } = useUser();
  const { getProjectById } = useProject();
  const userTimezone = user?.user_timezone;
  const projectTimezone = getProjectById(projectId)?.timezone;

  /**
   * Render a date in the user's timezone
   * @param date - The date to render
   * @param formatToken - The format token to use
   * @returns The formatted date
   */
  const renderFormattedDateInUserTimezone = useCallback(
    (date: string, formatToken: string = "MMM dd, yyyy") => {
      // return if undefined
      if (!date || !userTimezone) return;
      // convert the date to the user's timezone
      const convertedDate = new Date(date).toLocaleString("en-US", { timeZone: userTimezone });
      // return the formatted date
      return format(convertedDate, formatToken);
    },
    [userTimezone]
  );

  /**
   * Get the project's UTC offset
   * @returns The project's UTC offset
   */
  const getProjectUTCOffset = useCallback(() => {
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
  }, [projectTimezone]);

  /**
   * Check if the project's timezone is different from the user's timezone
   * @returns True if the project's timezone is different from the user's timezone, false otherwise
   */
  const isProjectTimeZoneDifferent = useCallback(() => {
    if (!projectTimezone || !userTimezone) return false;
    return projectTimezone !== userTimezone;
  }, [projectTimezone, userTimezone]);

  return {
    renderFormattedDateInUserTimezone,
    getProjectUTCOffset,
    isProjectTimeZoneDifferent,
  };
};
