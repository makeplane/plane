import { Fragment } from "react";

import { useRouter } from "next/router";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// react-datepicker
import DatePicker from "react-datepicker";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// hooks
import useIssuesView from "hooks/use-issues-view";
// components
import { DueDateFilterSelect } from "./due-date-filter-select";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";
// icons
import { XMarkIcon } from "@heroicons/react/20/solid";
// helpers
import { renderDateFormat, renderShortDateWithYearFormat } from "helpers/date-time.helper";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
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

export const DueDateFilterModal: React.FC<Props> = ({ isOpen, handleClose }) => {
  const { filters, setFilters } = useIssuesView();

  const router = useRouter();
  const { viewId } = router.query;

  const { handleSubmit, watch, control } = useForm<TFormValues>({
    defaultValues,
  });

  const handleFormSubmit = (formData: TFormValues) => {
    const { filterType, date1, date2 } = formData;

    if (filterType === "range") {
      setFilters(
        { target_date: [`${renderDateFormat(date1)};after`, `${renderDateFormat(date2)};before`] },
        !Boolean(viewId)
      );
    } else {
      const filteredArray = filters?.target_date?.filter((item) => {
        if (item?.includes(filterType)) return false;

        return true;
      });

      const filterOne = filteredArray && filteredArray?.length > 0 ? filteredArray[0] : null;
      if (filterOne)
        setFilters(
          { target_date: [filterOne, `${renderDateFormat(date1)};${filterType}`] },
          !Boolean(viewId)
        );
      else
        setFilters(
          {
            target_date: [`${renderDateFormat(date1)};${filterType}`],
          },
          !Boolean(viewId)
        );
    }
    handleClose();
  };

  const isInvalid =
    watch("filterType") === "range" ? new Date(watch("date1")) > new Date(watch("date2")) : false;

  const nextDay = new Date(watch("date1"));
  nextDay.setDate(nextDay.getDate() + 1);

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
              <Dialog.Panel className="relative flex transform rounded-lg border border-custom-border-200 bg-custom-background-100 px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
                  <div className="flex w-full justify-between">
                    <Controller
                      control={control}
                      name="filterType"
                      render={({ field: { value, onChange } }) => (
                        <DueDateFilterSelect value={value} onChange={onChange} />
                      )}
                    />
                    <XMarkIcon
                      className="border-base h-4 w-4 cursor-pointer"
                      onClick={handleClose}
                    />
                  </div>
                  <div className="flex w-full justify-between gap-4">
                    <Controller
                      control={control}
                      name="date1"
                      render={({ field: { value, onChange } }) => (
                        <DatePicker
                          selected={value}
                          onChange={(val) => onChange(val)}
                          dateFormat="dd-MM-yyyy"
                          calendarClassName="h-full"
                          inline
                        />
                      )}
                    />
                    {watch("filterType") === "range" && (
                      <Controller
                        control={control}
                        name="date2"
                        render={({ field: { value, onChange } }) => (
                          <DatePicker
                            selected={value}
                            onChange={onChange}
                            dateFormat="dd-MM-yyyy"
                            calendarClassName="h-full"
                            minDate={nextDay}
                            inline
                          />
                        )}
                      />
                    )}
                  </div>
                  {watch("filterType") === "range" && (
                    <h6 className="text-xs flex items-center gap-1">
                      <span className="text-custom-text-200">After:</span>
                      <span>{renderShortDateWithYearFormat(watch("date1"))}</span>
                      <span className="text-custom-text-200 ml-1">Before:</span>
                      {!isInvalid && <span>{renderShortDateWithYearFormat(watch("date2"))}</span>}
                    </h6>
                  )}
                  <div className="flex justify-end gap-4">
                    <SecondaryButton className="flex items-center gap-2" onClick={handleClose}>
                      Cancel
                    </SecondaryButton>
                    <PrimaryButton
                      type="submit"
                      className="flex items-center gap-2"
                      disabled={isInvalid}
                    >
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
