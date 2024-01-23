import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { Copy } from "lucide-react";
// ui
import { Button, Input } from "@plane/ui";
// types
import { IFormattedInstanceConfiguration } from "@plane/types";
// hooks
import { useApplication } from "hooks/store";
import useToast from "hooks/use-toast";

export interface IInstanceGoogleConfigForm {
  config: IFormattedInstanceConfiguration;
}

export interface GoogleConfigFormValues {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

export const InstanceGoogleConfigForm: FC<IInstanceGoogleConfigForm> = (props) => {
  const { config } = props;
  // store hooks
  const { instance: instanceStore } = useApplication();
  // toast
  const { setToastAlert } = useToast();
  // form data
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GoogleConfigFormValues>({
    defaultValues: {
      GOOGLE_CLIENT_ID: config["GOOGLE_CLIENT_ID"],
      GOOGLE_CLIENT_SECRET: config["GOOGLE_CLIENT_SECRET"],
    },
  });

  const onSubmit = async (formData: GoogleConfigFormValues) => {
    const payload: Partial<GoogleConfigFormValues> = { ...formData };

    await instanceStore
      .updateInstanceConfigurations(payload)
      .then(() =>
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Google Configuration Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  const originURL = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="flex flex-col gap-8">
      <div className="grid-col grid w-full grid-cols-1 justify-between gap-x-12 gap-y-8 lg:grid-cols-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Client ID</h4>
          <Controller
            control={control}
            name="GOOGLE_CLIENT_ID"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="GOOGLE_CLIENT_ID"
                name="GOOGLE_CLIENT_ID"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.GOOGLE_CLIENT_ID)}
                placeholder="840195096245-0p2tstej9j5nc4l8o1ah2dqondscqc1g.apps.googleusercontent.com"
                className="w-full rounded-md font-medium"
              />
            )}
          />
          <p className="text-xs text-custom-text-400">
            Your client ID lives in your Google API Console.{" "}
            <a
              href="https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#creatingcred"
              target="_blank"
              className="text-custom-primary-100 hover:underline"
              rel="noreferrer"
            >
              Learn more
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">JavaScript origin URL</h4>
          <Button
            variant="neutral-primary"
            className="flex items-center justify-between py-2"
            onClick={() => {
              navigator.clipboard.writeText(originURL);
              setToastAlert({
                message: "The Origin URL has been successfully copied to your clipboard",
                type: "success",
                title: "Copied to clipboard",
              });
            }}
          >
            <p className="text-sm font-medium">{originURL}</p>
            <Copy size={18} color="#B9B9B9" />
          </Button>
          <p className="text-xs text-custom-text-400">
            We will auto-generate this. Paste this into your Authorized JavaScript origins field. For this OAuth client{" "}
            <a
              href="https://console.cloud.google.com/apis/credentials/oauthclient"
              target="_blank"
              className="text-custom-primary-100 hover:underline"
              rel="noreferrer"
            >
              here.
            </a>
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center">
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};
