import { Controller, useForm } from "react-hook-form";
import { Button } from "@plane/propel/button";
import { Calendar } from "@plane/propel/calendar";
import { CloseIcon } from "@plane/propel/icons";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { renderFormattedPayloadDate, renderFormattedDate, getDate } from "@plane/utils";
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

export function DateFilterModal({ title, handleClose, isOpen, onSelect }: Props) {
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
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form className="space-y-4 px-5 py-8 sm:p-6">
        <div className="flex w-full justify-between">
          <Controller
            control={control}
            name="filterType"
            render={({ field: { value, onChange } }) => (
              <DateFilterSelect title={title} value={value} onChange={onChange} />
            )}
          />
          <CloseIcon className="h-4 w-4 cursor-pointer" onClick={handleClose} />
        </div>
        <div className="flex w-full justify-between gap-4">
          <Controller
            control={control}
            name="date1"
            render={({ field: { value, onChange } }) => {
              const dateValue = getDate(value);
              const date2Value = getDate(watch("date2"));
              return (
                <Calendar
                  className="rounded-md border border-subtle p-3"
                  captionLayout="dropdown"
                  selected={dateValue}
                  defaultMonth={dateValue}
                  onSelect={(date: Date | undefined) => {
                    if (!date) return;
                    onChange(date);
                  }}
                  mode="single"
                  disabled={date2Value ? [{ after: date2Value }] : undefined}
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
                  <Calendar
                    className="rounded-md border border-subtle p-3"
                    captionLayout="dropdown"
                    selected={dateValue}
                    defaultMonth={dateValue}
                    onSelect={(date: Date | undefined) => {
                      if (!date) return;
                      onChange(date);
                    }}
                    mode="single"
                    disabled={date1Value ? [{ before: date1Value }] : undefined}
                  />
                );
              }}
            />
          )}
        </div>
        {watch("filterType") === "range" && (
          <h6 className="flex items-center gap-1 text-11">
            <span className="text-secondary">After:</span>
            <span>{renderFormattedDate(watch("date1"))}</span>
            <span className="ml-1 text-secondary">Before:</span>
            {!isInvalid && <span>{renderFormattedDate(watch("date2"))}</span>}
          </h6>
        )}
        <div className="flex justify-end gap-4">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            type="button"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={isInvalid}
          >
            Apply
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
