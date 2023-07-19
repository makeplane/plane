import React, { Fragment } from "react";

// next
import { useRouter } from "next/router";

// react hook form
import { useForm, Controller } from "react-hook-form";

import { Transition, Dialog, Listbox } from "@headlessui/react";

// date helper
import { getDatesAfterCurrentDate, getTimestampAfterCurrentTime } from "helpers/date-time.helper";

// hooks
import useToast from "hooks/use-toast";

// components
import { PrimaryButton, SecondaryButton, Icon } from "components/ui";

// types
import type { IUserNotification } from "types";

type SnoozeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  notification: IUserNotification | null;
  onSubmit: (notificationId: string, dateTime?: Date | undefined) => Promise<void>;
};

const dates = getDatesAfterCurrentDate();
const timeStamps = getTimestampAfterCurrentTime();

const defaultValues = {
  time: null,
  date: null,
};

export const SnoozeNotificationModal: React.FC<SnoozeModalProps> = (props) => {
  const { isOpen, onClose, notification, onSuccess, onSubmit: handleSubmitSnooze } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const {
    formState: { isSubmitting },
    reset,
    handleSubmit,
    control,
  } = useForm<any>({
    defaultValues,
  });

  const onSubmit = async (formData: any) => {
    if (!workspaceSlug || !notification) return;

    const dateTime = new Date(
      `${formData.date.toLocaleDateString()} ${formData.time.toLocaleTimeString()}`
    );

    await handleSubmitSnooze(notification.id, dateTime).then(() => {
      onClose();
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
      reset();
      clearTimeout(timeout);
    }, 500);
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
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
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg border border-custom-border-100 bg-custom-background-80 p-5 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex justify-between items-center">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-custom-text-100"
                    >
                      Customize Snooze Time
                    </Dialog.Title>

                    <div>
                      <button type="button">
                        <Icon iconName="close" className="w-5 h-5 text-custom-text-100" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <div className="flex-1">
                      <Controller
                        control={control}
                        name="time"
                        rules={{ required: "Please select a time" }}
                        render={({ field: { value, onChange } }) => (
                          <Listbox value={value} onChange={onChange}>
                            {({ open }) => (
                              <>
                                <div className="relative mt-2">
                                  <Listbox.Button className="relative w-full cursor-default rounded-md border border-custom-border-100 bg-custom-background-100 py-1.5 pl-3 pr-10 text-left text-custom-text-100 shadow-sm focus:outline-none sm:text-sm sm:leading-6">
                                    <span className="flex items-center">
                                      <span className="ml-3 block truncate">
                                        {value
                                          ? new Date(value)?.toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })
                                          : "Select Time"}
                                      </span>
                                    </span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                                      <Icon
                                        iconName="expand_more"
                                        className="h-5 w-5 text-custom-text-100"
                                        aria-hidden="true"
                                      />
                                    </span>
                                  </Listbox.Button>

                                  <Transition
                                    show={open}
                                    as={Fragment}
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                  >
                                    <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-custom-background-100 py-1 text-base shadow-lg focus:outline-none sm:text-sm">
                                      {timeStamps.map((time, index) => (
                                        <Listbox.Option
                                          key={`${time.label}-${index}`}
                                          className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                              active
                                                ? "bg-custom-primary-100/80 text-custom-text-100"
                                                : "text-custom-text-700"
                                            }`
                                          }
                                          value={time.value}
                                        >
                                          {({ selected, active }) => (
                                            <>
                                              <div className="flex items-center">
                                                <span
                                                  className={`ml-3 block truncate ${
                                                    selected ? "font-semibold" : "font-normal"
                                                  }`}
                                                >
                                                  {time.label}
                                                </span>
                                              </div>

                                              {selected ? (
                                                <span
                                                  className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                                    active
                                                      ? "text-custom-text-100"
                                                      : "text-custom-primary-100"
                                                  }`}
                                                >
                                                  <Icon
                                                    iconName="done"
                                                    className="h-5 w-5"
                                                    aria-hidden="true"
                                                  />
                                                </span>
                                              ) : null}
                                            </>
                                          )}
                                        </Listbox.Option>
                                      ))}
                                    </Listbox.Options>
                                  </Transition>
                                </div>
                              </>
                            )}
                          </Listbox>
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <Controller
                        name="date"
                        control={control}
                        rules={{ required: "Please select a date" }}
                        render={({ field: { value, onChange } }) => (
                          <Listbox value={value} onChange={onChange}>
                            {({ open }) => (
                              <>
                                <div className="relative mt-2">
                                  <Listbox.Button className="relative w-full cursor-default rounded-md border border-custom-border-100 bg-custom-background-100 py-1.5 pl-3 pr-10 text-left text-custom-text-100 shadow-sm focus:outline-none sm:text-sm sm:leading-6">
                                    <span className="flex items-center">
                                      <span className="ml-3 block truncate">
                                        {value
                                          ? new Date(value)?.toLocaleDateString([], {
                                              day: "numeric",
                                              month: "long",
                                              year: "numeric",
                                            })
                                          : "Select Date"}
                                      </span>
                                    </span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                                      <Icon
                                        iconName="expand_more"
                                        className="h-5 w-5 text-custom-text-100"
                                        aria-hidden="true"
                                      />
                                    </span>
                                  </Listbox.Button>

                                  <Transition
                                    show={open}
                                    as={Fragment}
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                  >
                                    <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-custom-background-100 py-1 text-base shadow-lg focus:outline-none sm:text-sm">
                                      {dates.map((date, index) => (
                                        <Listbox.Option
                                          key={`${date.label}-${index}`}
                                          className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                              active
                                                ? "bg-custom-primary-100/80 text-custom-text-100"
                                                : "text-custom-text-700"
                                            }`
                                          }
                                          value={date.value}
                                        >
                                          {({ selected, active }) => (
                                            <>
                                              <div className="flex items-center">
                                                <span
                                                  className={`ml-3 block truncate ${
                                                    selected ? "font-semibold" : "font-normal"
                                                  }`}
                                                >
                                                  {date.label}
                                                </span>
                                              </div>

                                              {selected ? (
                                                <span
                                                  className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                                    active
                                                      ? "text-custom-text-100"
                                                      : "text-custom-primary-100"
                                                  }`}
                                                >
                                                  <Icon
                                                    iconName="done"
                                                    className="h-5 w-5"
                                                    aria-hidden="true"
                                                  />
                                                </span>
                                              ) : null}
                                            </>
                                          )}
                                        </Listbox.Option>
                                      ))}
                                    </Listbox.Options>
                                  </Transition>
                                </div>
                              </>
                            )}
                          </Listbox>
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-2">
                    <div className="w-full flex items-center gap-2 justify-end">
                      <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                      <PrimaryButton type="submit" loading={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </PrimaryButton>
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
