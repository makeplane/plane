import { useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
// plane imports
import { allTimeIn30MinutesInterval12HoursFormat } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { CloseIcon } from "@plane/propel/icons";
import { CustomSelect, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { getDate, cn } from "@plane/utils";
import { DateDropdown } from "@/components/dropdowns/date";

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

export function NotificationSnoozeModal(props: TNotificationSnoozeModal) {
  const { isOpen, onClose, onSubmit: handleSubmitSnooze } = props;

  const { workspaceSlug } = useParams();

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
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-h5-medium leading-6 text-primary">Customize Snooze Time</h3>

          <div>
            <button type="button" onClick={handleClose}>
              <CloseIcon className="h-5 w-5 text-primary" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:!flex-row md:items-center">
          <div className="flex-1 pb-3 md:pb-0">
            <h6 className="mb-2 block text-body-xs-medium text-placeholder">Pick a date</h6>
            <Controller
              name="date"
              control={control}
              rules={{ required: "Please select a date" }}
              render={({ field: { value, onChange } }) => (
                <DateDropdown
                  value={value || null}
                  placeholder="Select date"
                  onChange={(val) => {
                    setValue("time", undefined);
                    onChange(val);
                  }}
                  minDate={new Date()}
                  buttonVariant="border-with-text"
                  buttonContainerClassName="w-full text-left"
                  buttonClassName="border-strong px-3 py-2.5"
                  hideIcon
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
                        <span className="text-body-xs-medium text-placeholder">Select a time</span>
                      )}
                    </div>
                  }
                  input
                >
                  <div className="mb-2 flex h-9 w-full overflow-hidden rounded-xs">
                    <div
                      onClick={() => {
                        setValue("period", "AM");
                      }}
                      className={cn("flex h-full w-1/2 cursor-pointer items-center justify-center text-center", {
                        "bg-accent-primary/90 text-on-color": watch("period") === "AM",
                        "bg-layer-1": watch("period") !== "AM",
                      })}
                    >
                      AM
                    </div>
                    <div
                      onClick={() => {
                        setValue("period", "PM");
                      }}
                      className={cn("flex h-full w-1/2 cursor-pointer items-center justify-center text-center", {
                        "bg-accent-primary/90 text-on-color": watch("period") === "PM",
                        "bg-layer-1": watch("period") !== "PM",
                      })}
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
                    <p className="p-3 text-center text-secondary">No available time for this date.</p>
                  )}
                </CustomSelect>
              )}
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="secondary" size="lg" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </form>
    </ModalCore>
  );
}
