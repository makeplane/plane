"use client";
import { Fragment } from "react";

import { DayPicker } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";

import { X } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";

import { Button } from "@plane/ui";

import { renderFormattedPayloadDate, renderFormattedDate, getDate } from "@/helpers/date-time.helper";
import { DateFilterSelect } from "./date-filter-select";

type Props = {
  title: string;
  handleClose: () => void;
  isOpen: boolean;
  onSelect: (val: string[]) => void;
};

type TFormValues = {
  filterType: "before" | "after" | "range";
  date1: Date;
  date2: Date;
};

const defaultValues: TFormValues = {
  filterType: "range",
  date1: new Date(),
  date2: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
};

export const DateFilterModal: React.FC<Props> = ({ title, handleClose, isOpen, onSelect }) => {
  const { handleSubmit, watch, control } = useForm<TFormValues>({
    defaultValues,
  });

  const handleFormSubmit = (formData: TFormValues) => {
    const { filterType, date1, date2 } = formData;

    if (filterType === "range")
      onSelect([`${renderFormattedPayloadDate(date1)};after`, `${renderFormattedPayloadDate(date2)};before`]);
    else onSelect([`${renderFormattedPayloadDate(date1)};${filterType}`]);

    handleClose();
  };

  const date1 = getDate(watch("date1"));
  const date2 = getDate(watch("date1"));

  const isInvalid = watch("filterType") === "range" && date1 && date2 ? date1 > date2 : false;

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
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
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
              <Dialog.Panel className="relative flex transform rounded-lg bg-custom-background-100 px-5 py-8 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form className="space-y-4">
                  <div className="flex w-full justify-between">
                    <Controller
                      control={control}
                      name="filterType"
                      render={({ field: { value, onChange } }) => (
                        <DateFilterSelect title={title} value={value} onChange={onChange} />
                      )}
                    />
                    <X className="h-4 w-4 cursor-pointer" onClick={handleClose} />
                  </div>
                  <div className="flex w-full justify-between gap-4">
                    <Controller
                      control={control}
                      name="date1"
                      render={({ field: { value, onChange } }) => {
                        const dateValue = getDate(value);
                        const date2Value = getDate(watch("date2"));
                        return (
                          <DayPicker
                            selected={dateValue}
                            defaultMonth={dateValue}
                            onSelect={(date) => {
                              if (!date) return;
                              onChange(date);
                            }}
                            mode="single"
                            disabled={date2Value ? [{ after: date2Value }] : undefined}
                            className="border border-custom-border-200 p-3 rounded-md"
                          />
                        );
                      }}
                    />
                    {watch("filterType") === "range" && (
                      <Controller
                        control={control}
                        name="date2"
                        render={({ field: { value, onChange } }) => {
                          const dateValue = getDate(value);
                          const date1Value = getDate(watch("date1"));
                          return (
                            <DayPicker
                              selected={dateValue}
                              defaultMonth={dateValue}
                              onSelect={(date) => {
                                if (!date) return;
                                onChange(date);
                              }}
                              mode="single"
                              disabled={date1Value ? [{ before: date1Value }] : undefined}
                              className="border border-custom-border-200 p-3 rounded-md"
                            />
                          );
                        }}
                      />
                    )}
                  </div>
                  {watch("filterType") === "range" && (
                    <h6 className="flex items-center gap-1 text-xs">
                      <span className="text-custom-text-200">After:</span>
                      <span>{renderFormattedDate(watch("date1"))}</span>
                      <span className="ml-1 text-custom-text-200">Before:</span>
                      {!isInvalid && <span>{renderFormattedDate(watch("date2"))}</span>}
                    </h6>
                  )}
                  <div className="flex justify-end gap-4">
                    <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      type="button"
                      onClick={handleSubmit(handleFormSubmit)}
                      disabled={isInvalid}
                    >
                      Apply
                    </Button>
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
