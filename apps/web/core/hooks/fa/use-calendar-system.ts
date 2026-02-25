// [FA-CUSTOM] Hook for accessing the user's calendar system preference
import { ECalendarSystem } from "@plane/types";
import { useUserProfile } from "@/hooks/store/user";

export const useCalendarSystem = () => {
  const { data: profile } = useUserProfile();
  const calendarSystem = profile?.calendar_system ?? ECalendarSystem.GREGORIAN;
  const isJalali = calendarSystem === ECalendarSystem.JALALI;
  return { calendarSystem, isJalali };
};
