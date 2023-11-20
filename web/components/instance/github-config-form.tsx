import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input } from "@plane/ui";
// types
import { IFormattedInstanceConfiguration } from "types/instance";
// hooks
import useToast from "hooks/use-toast";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// icons
import { Copy } from "lucide-react";

export interface IInstanceGithubConfigForm {
  config: IFormattedInstanceConfiguration;
}

export interface GithubConfigFormValues {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export const InstanceGithubConfigForm: FC<IInstanceGithubConfigForm> = (props) => {
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
  } = useForm<GithubConfigFormValues>({
    defaultValues: {
      GITHUB_CLIENT_ID: config["GITHUB_CLIENT_ID"],
      GITHUB_CLIENT_SECRET: config["GITHUB_CLIENT_SECRET"],
    },
  });

  const onSubmit = async (formData: GithubConfigFormValues) => {
    const payload: Partial<GithubConfigFormValues> = { ...formData };

    await instanceStore
      .updateInstanceConfigurations(payload)
      .then(() =>
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Github Configuration Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  const originURL = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <>
      <div className="grid grid-col grid-cols-1 lg:grid-cols-2 items-center justify-between gap-x-16 gap-y-8 w-full">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Client ID</h4>
          <Controller
            control={control}
            name="GITHUB_CLIENT_ID"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="GITHUB_CLIENT_ID"
                name="GITHUB_CLIENT_ID"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.GITHUB_CLIENT_ID)}
                placeholder="Github Client ID"
                className="rounded-md font-medium w-full"
              />
            )}
          />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Client Secret</h4>
          <Controller
            control={control}
            name="GITHUB_CLIENT_SECRET"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="GITHUB_CLIENT_SECRET"
                name="GITHUB_CLIENT_SECRET"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.GITHUB_CLIENT_SECRET)}
                placeholder="Github Client Secret"
                className="rounded-md font-medium w-full"
              />
            )}
          />
        </div>
      </div>
      <div className="grid grid-col grid-cols-1 lg:grid-cols-2 items-center justify-between gap-x-16 gap-y-8 w-full">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Origin URL</h4>
          <Button
            variant="neutral-primary"
            className="py-2 flex justify-between items-center"
            onClick={() => {
              navigator.clipboard.writeText(originURL);
              setToastAlert({
                message: "The Origin URL has been successfully copied to your clipboard",
                type: "success",
                title: "Copied to clipboard",
              });
            }}
          >
            <p className="font-medium text-sm">{originURL}</p>
            <Copy size={18} color="#B9B9B9" />
          </Button>
          <p className="text-xs text-custom-text-400/60">*paste this URL in your Github console.</p>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center p-2">
            <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
