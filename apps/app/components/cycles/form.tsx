import { useEffect, useState } from "react";
import { useRouter } from "next/router";

// toast
import useToast from "hooks/use-toast";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, CustomDatePicker, CustomSelect, Input, TextArea } from "components/ui";
// types
import { ICycle } from "types";
// services
import cyclesService from "services/cycles.service";
// helper
import { getDateRangeStatus } from "helpers/date-time.helper";

type Props = {
  handleFormSubmit: (values: Partial<ICycle>) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  data?: ICycle;
};

const defaultValues: Partial<ICycle> = {
  name: "",
  description: "",
  start_date: null,
  end_date: null,
};

export const CycleForm: React.FC<Props> = ({ handleFormSubmit, handleClose, status, data }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const [isDateValid, setIsDateValid] = useState(true);

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    watch,
    reset,
  } = useForm<ICycle>({
    defaultValues,
  });

  const handleCreateUpdateCycle = async (formData: Partial<ICycle>) => {
    await handleFormSubmit(formData);

    reset({
      ...defaultValues,
    });
  };

  const cycleStatus =
    data?.start_date && data?.end_date ? getDateRangeStatus(data?.start_date, data?.end_date) : "";

  const dateChecker = async (payload: any) => {
    await cyclesService
      .cycleDateCheck(workspaceSlug as string, projectId as string, payload)
      .then((res) => {
        if (res.status) {
          setIsDateValid(true);
        } else {
          setIsDateValid(false);
          setToastAlert({
            type: "error",
            title: "Error!",
            message:
              "You have a cycle already on the given dates, if you want to create your draft cycle you can do that by removing dates",
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const checkEmptyDate =
    (watch("start_date") === "" && watch("end_date") === "") ||
    (!watch("start_date") && !watch("end_date"));

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateCycle)}>
      <div className="space-y-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {status ? "Update" : "Create"} Cycle
        </h3>
        <div className="space-y-3">
          <div>
            <Input
              id="name"
              label="Name"
              name="name"
              type="name"
              placeholder="Enter name"
              autoComplete="off"
              error={errors.name}
              register={register}
              validations={{
                required: "Name is required",
                maxLength: {
                  value: 255,
                  message: "Name should be less than 255 characters",
                },
              }}
            />
          </div>
          <div>
            <TextArea
              id="description"
              name="description"
              label="Description"
              placeholder="Enter description"
              error={errors.description}
              register={register}
            />
          </div>

          <div className="flex gap-x-2">
            <div className="w-full">
              <h6 className="text-gray-500">Start Date</h6>
              <div className="w-full">
                <Controller
                  control={control}
                  name="start_date"
                  render={({ field: { value, onChange } }) => (
                    <CustomDatePicker
                      renderAs="input"
                      value={value}
                      onChange={(val) => {
                        onChange(val);
                        val && watch("end_date") && cycleStatus != "current"
                          ? dateChecker({
                              start_date: val,
                              end_date: watch("end_date"),
                            })
                          : "";
                      }}
                      error={errors.start_date ? true : false}
                    />
                  )}
                />
                {errors.start_date && (
                  <h6 className="text-sm text-red-500">{errors.start_date.message}</h6>
                )}
              </div>
            </div>
            <div className="w-full">
              <h6 className="text-gray-500">End Date</h6>
              <div className="w-full">
                <Controller
                  control={control}
                  name="end_date"
                  render={({ field: { value, onChange } }) => (
                    <CustomDatePicker
                      renderAs="input"
                      value={value}
                      onChange={(val) => {
                        onChange(val);
                        val && watch("start_date") && cycleStatus != "current"
                          ? dateChecker({
                              start_date: watch("start_date"),
                              end_date: val,
                            })
                          : "";
                      }}
                      error={errors.end_date ? true : false}
                    />
                  )}
                />
                {errors.end_date && (
                  <h6 className="text-sm text-red-500">{errors.end_date.message}</h6>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button theme="secondary" onClick={handleClose}>
          Cancel
        </Button>

        <Button
          type="submit"
          className={
            checkEmptyDate
              ? "cursor-pointer"
              : isDateValid
              ? "cursor-pointer"
              : "cursor-not-allowed"
          }
          disabled={isSubmitting || checkEmptyDate ? false : isDateValid ? false : true}
        >
          {status
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
