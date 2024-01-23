import { FC, useState } from "react";
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input, ToggleSwitch } from "@plane/ui";
import { Eye, EyeOff } from "lucide-react";
// types
import { IFormattedInstanceConfiguration } from "@plane/types";
// hooks
import { useApplication } from "hooks/store";
import useToast from "hooks/use-toast";

export interface IInstanceEmailForm {
  config: IFormattedInstanceConfiguration;
}

export interface EmailFormValues {
  EMAIL_HOST: string;
  EMAIL_PORT: string;
  EMAIL_HOST_USER: string;
  EMAIL_HOST_PASSWORD: string;
  EMAIL_USE_TLS: string;
  // EMAIL_USE_SSL: string;
  EMAIL_FROM: string;
}

export const InstanceEmailForm: FC<IInstanceEmailForm> = (props) => {
  const { config } = props;
  // states
  const [showPassword, setShowPassword] = useState(false);
  // store hooks
  const { instance: instanceStore } = useApplication();
  // toast
  const { setToastAlert } = useToast();
  // form data
  const {
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormValues>({
    defaultValues: {
      EMAIL_HOST: config["EMAIL_HOST"],
      EMAIL_PORT: config["EMAIL_PORT"],
      EMAIL_HOST_USER: config["EMAIL_HOST_USER"],
      EMAIL_HOST_PASSWORD: config["EMAIL_HOST_PASSWORD"],
      EMAIL_USE_TLS: config["EMAIL_USE_TLS"],
      // EMAIL_USE_SSL: config["EMAIL_USE_SSL"],
      EMAIL_FROM: config["EMAIL_FROM"],
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
    <>
      <div className="grid-col grid w-full max-w-4xl grid-cols-1 items-center justify-between gap-x-20 gap-y-10 lg:grid-cols-2">
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
                placeholder="email.google.com"
                className="w-full rounded-md font-medium"
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
                placeholder="8080"
                className="w-full rounded-md font-medium"
              />
            )}
          />
        </div>
      </div>
      <div className="grid-col grid w-full max-w-4xl grid-cols-1 items-center justify-between gap-x-20 gap-y-10 lg:grid-cols-2">
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
                placeholder="getitdone@projectplane.so"
                className="w-full rounded-md font-medium"
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Password</h4>
          <div className="relative">
            <Controller
              control={control}
              name="EMAIL_HOST_PASSWORD"
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="EMAIL_HOST_PASSWORD"
                  name="EMAIL_HOST_PASSWORD"
                  type={showPassword ? "text" : "password"}
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.EMAIL_HOST_PASSWORD)}
                  placeholder="Password"
                  className="w-full rounded-md !pr-10 font-medium"
                />
              )}
            />
            {showPassword ? (
              <button
                className="absolute right-3 top-2.5 flex items-center justify-center text-custom-text-400"
                onClick={() => setShowPassword(false)}
              >
                <EyeOff className="h-4 w-4" />
              </button>
            ) : (
              <button
                className="absolute right-3 top-2.5 flex items-center justify-center text-custom-text-400"
                onClick={() => setShowPassword(true)}
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="grid-col grid w-full max-w-4xl grid-cols-1 items-center justify-between gap-x-20 gap-y-10 lg:grid-cols-2">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">From address</h4>
          <Controller
            control={control}
            name="EMAIL_FROM"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="EMAIL_FROM"
                name="EMAIL_FROM"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.EMAIL_FROM)}
                placeholder="no-reply@projectplane.so"
                className="w-full rounded-md font-medium"
              />
            )}
          />
          <p className="text-xs text-custom-text-400">
            This is the email address your users will see when getting emails from this instance. You will need to
            verify this address.
          </p>
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col gap-y-10 px-1">
        <div className="mr-8 flex items-center gap-10 pt-4">
          <div className="grow">
            <div className="text-sm font-medium text-custom-text-100">
              Turn TLS {Boolean(parseInt(watch("EMAIL_USE_TLS"))) ? "off" : "on"}
            </div>
            <div className="text-xs font-normal text-custom-text-300">Use this if your email domain supports TLS.</div>
          </div>
          <div className="shrink-0">
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

        {/* <div className="flex items-center gap-10 pt-4 mr-8">
          <div className="grow">
            <div className="text-custom-text-100 font-medium text-sm">
              Turn SSL {Boolean(parseInt(watch("EMAIL_USE_SSL"))) ? "off" : "on"}
            </div>
            <div className="text-custom-text-300 font-normal text-xs">
              Most email domains support SSL. Use this to secure comms between this instance and your users.
            </div>
          </div>
          <div className="shrink-0">
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
        </div> */}
      </div>

      <div className="flex max-w-4xl items-center py-1">
        <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </>
  );
};
