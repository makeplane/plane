import { Fragment, useState } from "react";

import { useRouter } from "next/router";

import { Controller, useForm } from "react-hook-form";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// hooks
import useIssuesView from "hooks/use-issues-view";
// components
import { PrimaryButton, SecondaryButton } from "components/ui";
import { XMarkIcon } from "@heroicons/react/20/solid";
// helper
import { renderDateFormat } from "helpers/date-time.helper";
// types
import { DueDateFilterSelect } from "./due-date-filter-select";
// fetch keys

type Props = {
  isOpen: boolean;
  handleClose: () => void;
};

const defaultValues = {
  range: "before",
  date1: new Date(),
  date2: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
};

export const DueDateFilterModal: React.FC<Props> = ({ isOpen, handleClose }) => {
  const { filters, setFilters } = useIssuesView();

  const router = useRouter();
  const { viewId } = router.query;

  const { handleSubmit, watch, control, setValue } = useForm<any>({
    defaultValues,
  });

  const handleFormSubmit = async (formData: any) => {
    const { range, date1, date2 } = formData;
    if (range === "range") {
      setFilters(
        {
          ...(filters ?? {}),
          target_date: [`${renderDateFormat(date1)};after`, `${renderDateFormat(date2)};before`],
        },
        !Boolean(viewId)
      );
    } else {
      const filteredArray = filters?.target_date?.filter((item) => {
        if (item?.includes(range)) {
          return false;
        }
        return true;
      });
      const filterOne = filteredArray && filteredArray?.length > 0 ? filteredArray[0] : null;
      if (filterOne !== null) {
        setFilters(
          {
            ...(filters ?? {}),
            target_date: [filterOne, `${renderDateFormat(date1)};${range}`],
          },
          !Boolean(viewId)
        );
      } else {
        setFilters(
          {
            ...(filters ?? {}),
            target_date: [`${renderDateFormat(date1)};${range}`],
          },
          !Boolean(viewId)
        );
      }
    }
    handleClose();
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
          <div className="fixed inset-0 bg-brand-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-20 flex w-full justify-center overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative flex transform rounded-lg border border-brand-base bg-brand-base px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                  <div className="flex w-full justify-between">
                    <div className="mb-4 w-48">
                      <Controller
                        control={control}
                        name="range"
                        render={({ field: { value, onChange } }) => (
                          <DueDateFilterSelect value={value} onChange={onChange} />
                        )}
                      />
                    </div>
                    <XMarkIcon
                      className="border-base h-4 w-4 cursor-pointer"
                      onClick={handleClose}
                    />
                  </div>
                  <div className="flex w-full justify-between">
                    <DatePicker
                      selected={watch("date1")}
                      onChange={(val) => {
                        setValue("date1", val);
                      }}
                      dateFormat="dd-MM-yyyy"
                      inline
                      value={watch("date1")}
                    />
                    {watch("range") === "range" && (
                      <DatePicker
                        selected={watch("date2")}
                        onChange={(val) => {
                          setValue("date2", val);
                        }}
                        dateFormat="dd-MM-yyyy"
                        inline
                        shouldCloseOnSelect={false}
                        value={watch("date2")}
                      />
                    )}
                  </div>
                  <div className="mt-4 flex justify-end gap-4">
                    <SecondaryButton className="flex items-center gap-2" onClick={handleClose}>
                      Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" className="flex items-center gap-2">
                      Apply
                    </PrimaryButton>
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
