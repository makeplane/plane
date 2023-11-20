import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input, ToggleSwitch } from "@plane/ui";
// types
import { IFormattedInstanceConfiguration } from "types/instance";
// hooks
import useToast from "hooks/use-toast";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

export interface IInstanceEmailForm {
  config: IFormattedInstanceConfiguration;
}

export interface EmailFormValues {
  EMAIL_HOST: string;
  EMAIL_PORT: string;
  EMAIL_HOST_USER: string;
  EMAIL_HOST_PASSWORD: string;
  EMAIL_USE_TLS: string;
  EMAIL_USE_SSL: string;
}

export const InstanceEmailForm: FC<IInstanceEmailForm> = (props) => {
  const { config } = props;
  // store
  const { instance: instanceStore } = useMobxStore();
  // toast
  const { setToastAlert } = useToast();
  // form data
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormValues>({
    defaultValues: {
      EMAIL_HOST: config["EMAIL_HOST"],
      EMAIL_PORT: config["EMAIL_PORT"],
      EMAIL_HOST_USER: config["EMAIL_HOST_USER"],
      EMAIL_HOST_PASSWORD: config["EMAIL_HOST_PASSWORD"],
      EMAIL_USE_TLS: config["EMAIL_USE_TLS"],
      EMAIL_USE_SSL: config["EMAIL_USE_SSL"],
    },
  });

  const onSubmit = async (formData: EmailFormValues) => {
    const payload: Partial<EmailFormValues> = { ...formData };

    await instanceStore
      .updateInstanceConfigurations(payload)
      .then(() =>
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Email Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <div className="flex flex-col gap-8 m-8 w-4/5">
      <div className="pb-2 mb-2 border-b border-custom-border-100">
        <div className="text-custom-text-100 font-medium text-lg">Email</div>
        <div className="text-custom-text-300 font-normal text-sm">Email related settings.</div>
      </div>
      <div className="grid grid-col grid-cols-1 lg:grid-cols-2 items-center justify-between gap-x-16 gap-y-8 w-full">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Host</h4>
          <Controller
            control={control}
            name="EMAIL_HOST"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="EMAIL_HOST"
                name="EMAIL_HOST"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.EMAIL_HOST)}
                placeholder="Email Host"
                className="rounded-md font-medium w-full"
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Port</h4>
          <Controller
            control={control}
            name="EMAIL_PORT"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="EMAIL_PORT"
                name="EMAIL_PORT"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.EMAIL_PORT)}
                placeholder="Email Port"
                className="rounded-md font-medium w-full"
              />
            )}
          />
        </div>
      </div>
      <div className="grid grid-col grid-cols-1 lg:grid-cols-2 items-center justify-between gap-x-16 gap-y-8 w-full">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Username</h4>
          <Controller
            control={control}
            name="EMAIL_HOST_USER"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="EMAIL_HOST_USER"
                name="EMAIL_HOST_USER"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.EMAIL_HOST_USER)}
                placeholder="Username"
                className="rounded-md font-medium w-full"
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Password</h4>
          <Controller
            control={control}
            name="EMAIL_HOST_PASSWORD"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="EMAIL_HOST_PASSWORD"
                name="EMAIL_HOST_PASSWORD"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.EMAIL_HOST_PASSWORD)}
                placeholder="Password"
                className="rounded-md font-medium w-full"
              />
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-8 pt-4">
        <div>
          <div className="text-custom-text-100 font-medium text-sm">Enable TLS</div>
        </div>
        <div>
          <Controller
            control={control}
            name="EMAIL_USE_TLS"
            render={({ field: { value, onChange } }) => (
              <ToggleSwitch
                value={Boolean(parseInt(value))}
                onChange={() => {
                  Boolean(parseInt(value)) === true ? onChange("0") : onChange("1");
                }}
                size="sm"
              />
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-8 pt-4">
        <div>
          <div className="text-custom-text-100 font-medium text-sm">Enable SSL</div>
        </div>
        <div>
          <Controller
            control={control}
            name="EMAIL_USE_SSL"
            render={({ field: { value, onChange } }) => (
              <ToggleSwitch
                value={Boolean(parseInt(value))}
                onChange={() => {
                  Boolean(parseInt(value)) === true ? onChange("0") : onChange("1");
                }}
                size="sm"
              />
            )}
          />
        </div>
      </div>

      <div className="flex items-center py-1">
        <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
