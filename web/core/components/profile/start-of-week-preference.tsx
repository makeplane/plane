"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { EStartOfTheWeek, START_OF_THE_WEEK_OPTIONS } from "@plane/constants";
import { CustomSelect, setToast, TOAST_TYPE } from "@plane/ui";
// hooks
import { useUserProfile } from "@/hooks/store";
import { PreferencesSection } from "../preferences/section";

const getStartOfWeekLabel = (startOfWeek: EStartOfTheWeek) =>
  START_OF_THE_WEEK_OPTIONS.find((option) => option.value === startOfWeek)?.label;

export const StartOfWeekPreference = observer((props: { option: { title: string; description: string } }) => {
  // hooks
  const { data: userProfile, updateUserProfile } = useUserProfile();

  return (
    <PreferencesSection
      title={props.option.title}
      description={props.option.description}
      control={
        <div className="">
          <CustomSelect
            value={userProfile.start_of_the_week}
            label={getStartOfWeekLabel(userProfile.start_of_the_week)}
            onChange={(val: EStartOfTheWeek) => {
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
      }
    />
  );
});
