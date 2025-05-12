"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { EStartOfTheWeek, START_OF_THE_WEEK_OPTIONS } from "@plane/constants";
import { CustomSelect, setToast, TOAST_TYPE } from "@plane/ui";
// hooks
import { useUserProfile } from "@/hooks/store";

const getStartOfWeekLabel = (startOfWeek: EStartOfTheWeek) =>
  START_OF_THE_WEEK_OPTIONS.find((option) => option.value === startOfWeek)?.label;

export const StartOfWeekPreference = observer(() => {
  // hooks
  const { data: userProfile, updateUserProfile } = useUserProfile();

  return (
    <div className="grid grid-cols-12 gap-4 py-6 sm:gap-16">
      <div className="col-span-12 sm:col-span-6">
        <h4 className="text-lg font-semibold text-custom-text-100">First day of the week</h4>
        <p className="text-sm text-custom-text-200">This will change how all calendars in your app look.</p>
      </div>
      <div className="col-span-12 sm:col-span-6">
        <CustomSelect
          value={userProfile.start_of_the_week}
          label={getStartOfWeekLabel(userProfile.start_of_the_week)}
          onChange={(val: number) => {
            updateUserProfile({ start_of_the_week: val })
              .then(() => {
                setToast({
                  type: TOAST_TYPE.SUCCESS,
                  title: "Success",
                  message: "First day of the week updated successfully",
                });
              })
              .catch(() => {
                setToast({ type: TOAST_TYPE.ERROR, title: "Update failed", message: "Please try again later." });
              });
          }}
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
    </div>
  );
});
