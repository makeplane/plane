import { FC, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Copy, Eye, EyeOff } from "lucide-react";
// ui
import { Button, Input } from "@plane/ui";
// types
import { IFormattedInstanceConfiguration } from "@plane/types";
// hooks
import { useApplication } from "hooks/store";
import useToast from "hooks/use-toast";

export interface IInstanceGithubConfigForm {
  config: IFormattedInstanceConfiguration;
}

export interface GithubConfigFormValues {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export const InstanceGithubConfigForm: FC<IInstanceGithubConfigForm> = (props) => {
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
    <div className="flex flex-col gap-8">
      <div className="grid-col grid w-full grid-cols-1 justify-between gap-x-12 gap-y-8 lg:grid-cols-3">
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
                placeholder="70a44354520df8bd9bcd"
                className="w-full rounded-md font-medium"
              />
            )}
          />
          <p className="text-xs text-custom-text-400">
            You will get this from your{" "}
            <a
              href="https://github.com/settings/applications/new"
              target="_blank"
              className="text-custom-primary-100 hover:underline"
              rel="noreferrer"
            >
              GitHub OAuth application settings.
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Client secret</h4>
          <div className="relative">
            <Controller
              control={control}
              name="GITHUB_CLIENT_SECRET"
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="GITHUB_CLIENT_SECRET"
                  name="GITHUB_CLIENT_SECRET"
                  type={showPassword ? "text" : "password"}
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.GITHUB_CLIENT_SECRET)}
                  placeholder="9b0050f94ec1b744e32ce79ea4ffacd40d4119cb"
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

          <p className="text-xs text-custom-text-400">
            Your client secret is also found in your{" "}
            <a
              href="https://github.com/settings/applications/new"
              target="_blank"
              className="text-custom-primary-100 hover:underline"
              rel="noreferrer"
            >
              GitHub OAuth application settings.
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Origin URL</h4>
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
            We will auto-generate this. Paste this into the Authorization callback URL field{" "}
            <a
              href="https://github.com/settings/applications/new"
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
