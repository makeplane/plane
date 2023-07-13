import React, { Fragment } from "react";

// next
import { useRouter } from "next/router";

// react hook form
import { useForm, Controller } from "react-hook-form";

import { Transition, Dialog, Listbox } from "@headlessui/react";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/20/solid";

// date helper
import { getDatesAfterCurrentDate, getTimestampAfterCurrentTime } from "helpers/date-time.helper";

// services
import userNotificationServices from "services/notifications.service";

// hooks
import useToast from "hooks/use-toast";

// components
import { PrimaryButton, SecondaryButton } from "components/ui";

// icons
import { XMarkIcon } from "components/icons";

type SnoozeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  notificationId: string | null;
};

const dates = getDatesAfterCurrentDate();
const timeStamps = getTimestampAfterCurrentTime();

export const SnoozeNotificationModal: React.FC<SnoozeModalProps> = (props) => {
  const { isOpen, onClose, notificationId, onSuccess } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const {
    formState: { isSubmitting },
    reset,
    handleSubmit,
    control,
  } = useForm<any>();

  const onSubmit = async (formData: any) => {
    if (!workspaceSlug || !notificationId) return;

    const dateTime = new Date(
      `${formData.date.toLocaleDateString()} ${formData.time.toLocaleTimeString()}`
    );

    await userNotificationServices
      .patchUserNotification(workspaceSlug.toString(), notificationId, {
        snoozed_till: dateTime,
      })
      .then(() => {
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
          <div className="fixed inset-0 bg-brand-backdrop bg-opacity-50 transition-opacity" />
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
                        <XMarkIcon className="w-5 h-5 text-custom-text-100" />
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
                                  <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
                                    <span className="flex items-center">
                                      <span className="ml-3 block truncate">
                                        {value?.toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }) || "Select Time"}
                                      </span>
                                    </span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                                      <ChevronDownIcon
                                        className="h-5 w-5 text-gray-400"
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
                                    <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                      {timeStamps.map((time, index) => (
                                        <Listbox.Option
                                          key={`${time.label}-${index}`}
                                          className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                              active
                                                ? "bg-custom-primary-100 text-custom-text-100"
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
                                                  <CheckIcon
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
                                  <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
                                    <span className="flex items-center">
                                      <span className="ml-3 block truncate">
                                        {value?.toLocaleDateString([], {
                                          day: "numeric",
                                          month: "long",
                                          year: "numeric",
                                        }) || "Select Date"}
                                      </span>
                                    </span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                                      <ChevronDownIcon
                                        className="h-5 w-5 text-gray-400"
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
                                    <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                      {dates.map((date, index) => (
                                        <Listbox.Option
                                          key={`${date.label}-${index}`}
                                          className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                              active
                                                ? "bg-custom-primary-100 text-custom-text-100"
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
                                                  <CheckIcon
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
                        Submit
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
