import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input } from "@plane/ui";
// types
import { IInstance, IInstanceAdmin } from "@plane/types";
// hooks
import { useApplication } from "hooks/store";
import useToast from "hooks/use-toast";

export interface IInstanceGeneralForm {
  instance: IInstance;
  instanceAdmins: IInstanceAdmin[];
}

export interface GeneralFormValues {
  instance_name: string;
  // is_telemetry_enabled: boolean;
}

export const InstanceGeneralForm: FC<IInstanceGeneralForm> = (props) => {
  const { instance, instanceAdmins } = props;
  // store hooks
  const { instance: instanceStore } = useApplication();
  // toast
  const { setToastAlert } = useToast();
  // form data
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GeneralFormValues>({
    defaultValues: {
      instance_name: instance.instance_name,
      // is_telemetry_enabled: instance.is_telemetry_enabled,
    },
  });

  const onSubmit = async (formData: GeneralFormValues) => {
    const payload: Partial<GeneralFormValues> = { ...formData };

    await instanceStore
      .updateInstanceInfo(payload)
      .then(() =>
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <>
      <div className="grid-col grid w-full grid-cols-1 items-center justify-between gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Name of instance</h4>
          <Controller
            control={control}
            name="instance_name"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="instance_name"
                name="instance_name"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.instance_name)}
                placeholder="Instance Name"
                className="w-full rounded-md font-medium"
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Admin email</h4>
          <Input
            id="email"
            name="email"
            type="email"
            value={instanceAdmins[0].user_detail.email ?? ""}
            placeholder="Admin email"
            className="w-full cursor-not-allowed !text-custom-text-400"
            disabled
          />
        </div>

        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Instance ID</h4>
          <Input
            id="instance_id"
            name="instance_id"
            type="text"
            value={instance.instance_id}
            className="w-full cursor-not-allowed rounded-md font-medium !text-custom-text-400"
            disabled
          />
        </div>
      </div>

      {/* <div className="flex items-center gap-12 pt-4">
        <div>
          <div className="text-custom-text-100 font-medium text-sm">Share anonymous usage instance</div>
          <div className="text-custom-text-300 font-normal text-xs">
            Help us understand how you use Plane so we can build better for you.
          </div>
        </div>
        <div>
          <Controller
            control={control}
            name="is_telemetry_enabled"
            render={({ field: { value, onChange } }) => <ToggleSwitch value={value} onChange={onChange} size="sm" />}
          />
        </div>
      </div> */}

      <div className="flex items-center py-1">
        <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </>
  );
};
