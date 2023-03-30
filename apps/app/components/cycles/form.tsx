import { useEffect, useState } from "react";

import { useRouter } from "next/router";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// services
import cyclesService from "services/cycles.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
import { DateSelect } from "components/cycles";
// helpers
import { getDateRangeStatus, isDateRangeValid } from "helpers/date-time.helper";
// types
import { ICycle } from "types";

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
              mode="transparent"
              autoComplete="off"
              id="name"
              name="name"
              type="name"
              className="resize-none text-xl"
              placeholder="Title"
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
              placeholder="Description"
              className="h-32 resize-none text-sm"
              mode="transparent"
              error={errors.description}
              register={register}
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
                    onChange={(val) => {
                      onChange(val);
                      if (val && watch("end_date")) {
                        if (isDateRangeValid(val, `${watch("end_date")}`)) {
                          cycleStatus != "current" &&
                            dateChecker({
                              start_date: val,
                              end_date: watch("end_date"),
                            });
                        } else {
                          setIsDateValid(false);
                          setToastAlert({
                            type: "error",
                            title: "Error!",
                            message: "You have enter invalid date.",
                          });
                        }
                      }
                    }}
                  />
                )}
              />
            </div>
            <div>
              <Controller
                control={control}
                name="end_date"
                render={({ field: { value, onChange } }) => (
                  <DateSelect
                    label="End date"
                    value={value}
                    onChange={(val) => {
                      onChange(val);
                      if (watch("start_date") && val) {
                        if (isDateRangeValid(`${watch("start_date")}`, val)) {
                          cycleStatus != "current" &&
                            dateChecker({
                              start_date: watch("start_date"),
                              end_date: val,
                            });
                        } else {
                          setIsDateValid(false);
                          setToastAlert({
                            type: "error",
                            title: "Error!",
                            message: "You have enter invalid date.",
                          });
                        }
                      }
                    }}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="-mx-5 mt-5 flex justify-end gap-2 border-t px-5 pt-5">
        <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
        <PrimaryButton
          type="submit"
          className={
            checkEmptyDate
              ? "cursor-pointer"
              : isDateValid
              ? "cursor-pointer"
              : "cursor-not-allowed"
          }
          loading={isSubmitting || checkEmptyDate ? false : isDateValid ? false : true}
        >
          {status
            ? isSubmitting
              ? "Updating Cycle..."
              : "Update Cycle"
            : isSubmitting
            ? "Creating Cycle..."
            : "Create Cycle"}
        </PrimaryButton>
      </div>
    </form>
  );
};
