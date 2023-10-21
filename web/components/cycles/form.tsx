import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input, TextArea } from "@plane/ui";
import { DateSelect } from "components/ui";
// types
import { ICycle } from "types";

type Props = {
  handleFormSubmit: (values: Partial<ICycle>) => Promise<void>;
  handleClose: () => void;
  data?: ICycle | null;
};

export const CycleForm: React.FC<Props> = (props) => {
  const { handleFormSubmit, handleClose, data } = props;
  // form data
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    watch,
  } = useForm<ICycle>({
    defaultValues: {
      name: data?.name || "",
      description: data?.description || "",
      start_date: data?.start_date || null,
      end_date: data?.end_date || null,
    },
  });

  const startDate = watch("start_date");
  const endDate = watch("end_date");

  const minDate = startDate ? new Date(startDate) : new Date();
  minDate.setDate(minDate.getDate() + 1);

  const maxDate = endDate ? new Date(endDate) : null;
  maxDate?.setDate(maxDate.getDate() - 1);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="space-y-5">
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">{status ? "Update" : "Create"} Cycle</h3>
        <div className="space-y-3">
          <div>
            <Controller
              name="name"
              control={control}
              rules={{
                required: "Name is required",
                maxLength: {
                  value: 255,
                  message: "Name should be less than 255 characters",
                },
              }}
              render={({ field: { value, onChange } }) => (
                <Input
                  id="cycle_name"
                  name="name"
                  type="text"
                  placeholder="Cycle Name"
                  className="resize-none text-xl w-full p-2"
                  value={value}
                  onChange={onChange}
                  hasError={Boolean(errors?.name)}
                />
              )}
            />
          </div>
          <div>
            <Controller
              name="description"
              control={control}
              render={({ field: { value, onChange } }) => (
                <TextArea
                  id="cycle_description"
                  name="description"
                  placeholder="Description"
                  className="h-32 resize-none text-sm"
                  hasError={Boolean(errors?.description)}
                  value={value}
                  onChange={onChange}
                />
              )}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div>
              <Controller
                control={control}
                name="start_date"
                render={({ field: { value, onChange } }) => (
                  <DateSelect
                    label="Start date"
                    value={value}
                    onChange={(val) => onChange(val)}
                    minDate={new Date()}
                    maxDate={maxDate ?? undefined}
                  />
                )}
              />
            </div>
            <div>
              <Controller
                control={control}
                name="end_date"
                render={({ field: { value, onChange } }) => (
                  <DateSelect label="End date" value={value} onChange={(val) => onChange(val)} minDate={minDate} />
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="-mx-5 mt-5 flex justify-end gap-2 border-t border-custom-border-200 px-5 pt-5">
        <Button variant="neutral-primary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={isSubmitting}>
          {data
            ? isSubmitting
              ? "Updating Cycle..."
              : "Update Cycle"
            : isSubmitting
            ? "Creating Cycle..."
            : "Create Cycle"}
        </Button>
      </div>
    </form>
  );
};
