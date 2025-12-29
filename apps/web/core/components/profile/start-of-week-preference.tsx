import { observer } from "mobx-react";
// plane imports
import { START_OF_THE_WEEK_OPTIONS } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { EStartOfTheWeek } from "@plane/types";
import { CustomSelect } from "@plane/ui";
// hooks
import { useUserProfile } from "@/hooks/store/user";
import { PreferencesSection } from "../preferences/section";

const getStartOfWeekLabel = (startOfWeek: EStartOfTheWeek) =>
  START_OF_THE_WEEK_OPTIONS.find((option) => option.value === startOfWeek)?.label;

export const StartOfWeekPreference = observer(function StartOfWeekPreference(props: {
  option: { title: string; description: string };
}) {
  // hooks
  const { data: userProfile, updateUserProfile } = useUserProfile();

  const handleStartOfWeekChange = async (val: number) => {
    try {
      await updateUserProfile({ start_of_the_week: val });
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Success", message: "First day of the week updated successfully" });
    } catch (_error) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Update failed", message: "Please try again later." });
    }
  };

  return (
    <PreferencesSection
      title={props.option.title}
      description={props.option.description}
      control={
        <div className="">
          <CustomSelect
            value={userProfile.start_of_the_week}
            label={getStartOfWeekLabel(userProfile.start_of_the_week)}
            onChange={handleStartOfWeekChange}
            input
            maxHeight="lg"
          >
            <>
              {START_OF_THE_WEEK_OPTIONS.map((day) => (
                <CustomSelect.Option key={day.value} value={day.value}>
                  {day.label}
                </CustomSelect.Option>
              ))}
            </>
          </CustomSelect>
        </div>
      }
    />
  );
});
