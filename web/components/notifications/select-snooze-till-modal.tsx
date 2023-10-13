import { Fragment, FC } from "react";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import { Transition, Dialog } from "@headlessui/react";
// date helper
import { getAllTimeIn30MinutesInterval } from "helpers/date-time.helper";
// hooks
import useToast from "hooks/use-toast";
// components
import { Button } from "@plane/ui";
import { Icon, CustomDatePicker, CustomSelect } from "components/ui";
// types
import type { IUserNotification } from "types";

type SnoozeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  notification: IUserNotification | null;
  onSubmit: (notificationId: string, dateTime?: Date | undefined) => Promise<void>;
};

type FormValues = {
  time: string | null;
  date: Date | null;
  period: "AM" | "PM";
};

const defaultValues: FormValues = {
  time: null,
  date: null,
  period: "AM",
};

const timeStamps = getAllTimeIn30MinutesInterval();

export const SnoozeNotificationModal: FC<SnoozeModalProps> = (props) => {
  const { isOpen, onClose, notification, onSuccess, onSubmit: handleSubmitSnooze } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

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

  const getTimeStamp = () => {
    const today = new Date();
    const formDataDate = watch("date");

    if (!formDataDate) return timeStamps;

    const isToday = today.toDateString() === new Date(formDataDate).toDateString();

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
    if (!workspaceSlug || !notification || !formData.date || !formData.time) return;

    const period = formData.period;

    const time = formData.time.split(":");
    const hours = parseInt(
      `${period === "AM" ? time[0] : parseInt(time[0]) + 12 === 24 ? "00" : parseInt(time[0]) + 12}`
    );
    const minutes = parseInt(time[1]);

    const dateTime = new Date(formData.date);
    dateTime.setHours(hours);
    dateTime.setMinutes(minutes);

    await handleSubmitSnooze(notification.id, dateTime).then(() => {
      handleClose();
      onSuccess();
      setToastAlert({
        title: "Notification snoozed",
        message: "Notification snoozed successfully",
        type: "success",
      });
    });
  };

  const handleClose = () => {
    onClose();
    const timeout = setTimeout(() => {
      reset({ ...defaultValues });
      clearTimeout(timeout);
    }, 500);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg border border-custom-border-100 bg-custom-background-100 p-5 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex justify-between items-center">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                      Customize Snooze Time
                    </Dialog.Title>

                    <div>
                      <button type="button" onClick={handleClose}>
                        <Icon iconName="close" className="w-5 h-5 text-custom-text-100" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex-1">
                      <h6 className="block text-sm font-medium text-custom-text-400 mb-2">Pick a date</h6>
                      <Controller
                        name="date"
                        control={control}
                        rules={{ required: "Please select a date" }}
                        render={({ field: { value, onChange } }) => (
                          <CustomDatePicker
                            placeholder="Select date"
                            value={value}
                            onChange={(val) => {
                              setValue("time", null);
                              onChange(val);
                            }}
                            className="px-3 py-2 w-full rounded-md border border-custom-border-300 bg-custom-background-100 text-custom-text-100 focus:outline-none !text-sm"
                            noBorder
                            minDate={new Date()}
                          />
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <h6 className="block text-sm font-medium text-custom-text-400 mb-2">Pick a time</h6>
                      <Controller
                        control={control}
                        name="time"
                        rules={{ required: "Please select a time" }}
                        render={({ field: { value, onChange } }) => (
                          <CustomSelect
                            value={value}
                            onChange={onChange}
                            label={
                              <div className="truncate">
                                {value ? (
                                  <span>
                                    {value} {watch("period").toLowerCase()}
                                  </span>
                                ) : (
                                  <span className="text-custom-text-400 text-sm">Select a time</span>
                                )}
                              </div>
                            }
                            width="w-full"
                            input
                          >
                            <div className="w-full rounded overflow-hidden h-9 mb-2 flex">
                              <div
                                onClick={() => {
                                  setValue("period", "AM");
                                }}
                                className={`w-1/2 h-full cursor-pointer flex justify-center items-center text-center ${
                                  watch("period") === "AM"
                                    ? "bg-custom-primary-100/90 text-custom-primary-0"
                                    : "bg-custom-background-80"
                                }`}
                              >
                                AM
                              </div>
                              <div
                                onClick={() => {
                                  setValue("period", "PM");
                                }}
                                className={`w-1/2 h-full cursor-pointer flex justify-center items-center text-center ${
                                  watch("period") === "PM"
                                    ? "bg-custom-primary-100/90 text-custom-primary-0"
                                    : "bg-custom-background-80"
                                }`}
                              >
                                PM
                              </div>
                            </div>
                            {getTimeStamp().length > 0 ? (
                              getTimeStamp().map((time, index) => (
                                <CustomSelect.Option key={`${time}-${index}`} value={time.value}>
                                  <div className="flex items-center">
                                    <span className="ml-3 block truncate">{time.label}</span>
                                  </div>
                                </CustomSelect.Option>
                              ))
                            ) : (
                              <p className="text-custom-text-200 text-center p-3">No available time for this date.</p>
                            )}
                          </CustomSelect>
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-2">
                    <div className="w-full flex items-center gap-2 justify-end">
                      <Button variant="neutral-primary" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button variant="primary" type="submit" loading={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </Button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
