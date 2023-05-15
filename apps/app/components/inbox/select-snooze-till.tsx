import React, { useState } from "react";

// react-datepicker
import DatePicker from "react-datepicker";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// hooks
import useToast from "hooks/use-toast";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (snoozeTill: Date | string) => void;
};

export const SelectSnoozeTillModal: React.FC<Props> = (props) => {
  const { isOpen, onClose, onSubmit } = props;

  const [dateValue, setDateValue] = useState<Date>(new Date());

  const { setToastAlert } = useToast();

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    if (!dateValue)
      return setToastAlert({
        title: "Error",
        type: "error",
      });
    onSubmit(dateValue);
    handleClose();
  };

  return (
    <div className="flex flex-wrap items-start py-2">
      <div className="space-y-1 sm:basis-1/2">
        <Transition.Root show={isOpen} as={React.Fragment} appear>
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

            <div className="fixed inset-0 z-20 overflow-y-auto p-4 sm:p-6 md:p-20">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative mx-auto max-w-xs transform rounded-xl border border-brand-base bg-brand-base shadow-2xl transition-all">
                  <h2 className="mt-4 mb-2 px-3 font-semibold text-brand-base">Select issue</h2>
                  <div className="w-full flex justify-center items-center">
                    <DatePicker
                      selected={dateValue}
                      onChange={(val) => {
                        if (val) setDateValue(val);
                      }}
                      dateFormat="dd-MM-yyyy"
                      inline
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 p-3">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <PrimaryButton onClick={handleSubmit}>Snooze till</PrimaryButton>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>
      </div>
    </div>
  );
};
