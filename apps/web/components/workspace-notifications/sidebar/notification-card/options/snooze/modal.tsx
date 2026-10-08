/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
// plane imports
import { allTimeIn30MinutesInterval12HoursFormat } from "@plane/constants";
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogCloseGroup,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { DateSelect } from "@plane/blocks/property-select";
import { Select } from "@plane/blocks/select";
// components
import { getDate, cn } from "@plane/utils";
// hooks
import { useUserProfile } from "@/hooks/store/user";

type TNotificationSnoozeModal = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dateTime?: Date) => Promise<void>;
};

type FormValues = {
  time: string | undefined;
  date: Date | undefined;
  period: "AM" | "PM";
};

const defaultValues: FormValues = {
  time: undefined,
  date: undefined,
  period: "AM",
};

const timeStamps = allTimeIn30MinutesInterval12HoursFormat;

type TTimeOption = (typeof allTimeIn30MinutesInterval12HoursFormat)[number];

export function NotificationSnoozeModal(props: TNotificationSnoozeModal) {
  const { isOpen, onClose, onSubmit: handleSubmitSnooze } = props;

  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { data: userProfile } = useUserProfile();

  const {
    formState: { isSubmitting },
    reset,
    handleSubmit,
    control,
    watch,
    setValue,
  } = useForm({
    defaultValues,
  });

  const handleClose = () => {
    // This is a workaround to fix the issue of the Notification popover modal close on closing this modal
    const closeTimeout = setTimeout(() => {
      onClose();
      clearTimeout(closeTimeout);
    }, 50);

    const timeout = setTimeout(() => {
      reset({ ...defaultValues });
      clearTimeout(timeout);
    }, 500);
  };

  const getTimeStamp = () => {
    const today = new Date();
    const formDataDate = watch("date");

    if (!formDataDate) return timeStamps;

    const isToday = today.toDateString() === getDate(formDataDate)?.toDateString();

    if (!isToday) return timeStamps;

    const hours = today.getHours();
    const minutes = today.getMinutes();

    return timeStamps.filter((optionTime) => {
      let optionHours = parseInt(optionTime.value.split(":")[0]);
      const optionMinutes = parseInt(optionTime.value.split(":")[1]);

      const period = watch("period");

      if (period === "PM" && optionHours !== 12) optionHours += 12;

      if (optionHours < hours) return false;
      if (optionHours === hours && optionMinutes < minutes) return false;

      return true;
    });
  };

  const onSubmit = async (formData: FormValues) => {
    if (!workspaceSlug || !formData.date || !formData.time) return;

    const period = formData.period;

    const time = formData.time.split(":");
    const hours = parseInt(
      `${period === "AM" ? time[0] : parseInt(time[0]) + 12 === 24 ? "00" : parseInt(time[0]) + 12}`
    );
    const minutes = parseInt(time[1]);

    const dateTime: Date | undefined = getDate(formData?.date);
    dateTime?.setHours(hours);
    dateTime?.setMinutes(minutes);

    await handleSubmitSnooze(dateTime).then(() => {
      handleClose();
    });
  };

  return (
    <Dialog
      open={isOpen}
      // The legacy ModalCore closed on Escape and outside click via `handleClose`, so default dismissal stays.
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="md">
        <DialogCloseGroup>
          <IconButton
            variant="ghost"
            size="xs"
            aria-label={t("close")}
            icon={<Icon icon={CloseOutline} />}
            render={<DialogClose />}
          />
        </DialogCloseGroup>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DialogMain>
            <DialogHeader>
              <DialogHeading>
                <DialogTitle>Customize Snooze Time</DialogTitle>
              </DialogHeading>
            </DialogHeader>
            <DialogBody tabIndex={0}>
              <div className="flex flex-col gap-3 md:!flex-row md:items-center">
                <div className="flex-1 pb-3 md:pb-0">
                  <h6 className="mb-2 block text-body-xs-medium text-placeholder">Pick a date</h6>
                  <Controller
                    name="date"
                    control={control}
                    rules={{ required: "Please select a date" }}
                    render={({ field: { value, onChange } }) => (
                      <DateSelect
                        value={value ?? null}
                        placeholder="Select date"
                        onChange={(val) => {
                          setValue("time", undefined);
                          onChange(val ?? undefined);
                        }}
                        minDate={new Date()}
                        clearable
                        weekStartsOn={userProfile?.start_of_the_week}
                        variant="select-lg"
                      />
                    )}
                  />
                </div>
                <div className="flex-1">
                  <h6 className="mb-2 block text-body-xs-medium text-placeholder">Pick a time</h6>
                  <Controller
                    control={control}
                    name="time"
                    rules={{ required: "Please select a time" }}
                    render={({ field: { value, onChange } }) => (
                      <Select<TTimeOption>
                        value={timeStamps.find((option) => option.value === value) ?? null}
                        onChange={onChange}
                        getValues={getTimeStamp}
                        getOptionValue={(option) => option.value}
                        getOptionLabel={(option) => option.label}
                        showSearch={false}
                        pinSelected={false}
                        emptyMessage="No available time for this date."
                        header={
                          <div className="mb-2 flex h-9 w-full overflow-hidden rounded-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setValue("period", "AM");
                              }}
                              className={cn(
                                "flex h-full w-1/2 cursor-pointer items-center justify-center text-center",
                                {
                                  "bg-accent-primary/90 text-on-color": watch("period") === "AM",
                                  "bg-layer-1": watch("period") !== "AM",
                                }
                              )}
                            >
                              AM
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setValue("period", "PM");
                              }}
                              className={cn(
                                "flex h-full w-1/2 cursor-pointer items-center justify-center text-center",
                                {
                                  "bg-accent-primary/90 text-on-color": watch("period") === "PM",
                                  "bg-layer-1": watch("period") !== "PM",
                                }
                              )}
                            >
                              PM
                            </button>
                          </div>
                        }
                      >
                        <Select.Trigger<TTimeOption> variant="select-lg">
                          <span className="min-w-0 grow truncate text-left">
                            {value ? (
                              <span>
                                {value} {watch("period").toLowerCase()}
                              </span>
                            ) : (
                              <span className="text-body-xs-medium text-placeholder">Select a time</span>
                            )}
                          </span>
                        </Select.Trigger>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </DialogBody>
          </DialogMain>
          <DialogActions>
            <Button variant="secondary" size="md" stretch="auto" label="Cancel" onClick={handleClose} />
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              type="submit"
              label={isSubmitting ? "Submitting..." : "Submit"}
              loading={isSubmitting}
            />
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
