import { FC, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Copy, Eye, EyeOff } from "lucide-react";
// ui
import { Button, Input, ToggleSwitch } from "@plane/ui";
// types
import { IFormattedInstanceConfiguration } from "@plane/types";
// hooks
import { useApplication } from "hooks/store";
import useToast from "hooks/use-toast";

export interface IInstanceOidcConfigForm {
  config: IFormattedInstanceConfiguration;
  updateConfig: (
    key: "ENABLE_SIGNUP" | "ENABLE_MAGIC_LINK_LOGIN" | "ENABLE_EMAIL_PASSWORD" | "OIDC_AUTO",
    value: string
  ) => Promise<void>;
  isSubmittingAuto: boolean;
}

export interface OidcConfigFormValues {
  OIDC_URL_AUTHORIZATION: string;
  OIDC_URL_TOKEN: string;
  OIDC_URL_USERINFO: string;
  OIDC_CLIENT_ID: string;
  OIDC_CLIENT_SECRET: string;
  OIDC_URL_ENDSESSION?: string;
}

export const InstanceOidcConfigForm: FC<IInstanceOidcConfigForm> = (props) => {
  const { config, updateConfig, isSubmittingAuto } = props;
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
  } = useForm<OidcConfigFormValues>({
    defaultValues: {
      OIDC_URL_AUTHORIZATION: config["OIDC_URL_AUTHORIZATION"],
      OIDC_URL_TOKEN: config["OIDC_URL_TOKEN"],
      OIDC_URL_USERINFO: config["OIDC_URL_USERINFO"],
      OIDC_URL_ENDSESSION: config["OIDC_URL_ENDSESSION"],
      OIDC_CLIENT_ID: config["OIDC_CLIENT_ID"],
      OIDC_CLIENT_SECRET: config["OIDC_CLIENT_SECRET"],
    },
  });

  const oidcAuto = config.OIDC_AUTO ?? "0";

  const onSubmit = async (formData: OidcConfigFormValues) => {
    const payload: Partial<OidcConfigFormValues> = { ...formData };

    await instanceStore
      .updateInstanceConfigurations(payload)
      .then(() =>
        setToastAlert({
          title: "Success",
          type: "success",
          message: "OpenID Connect Configuration Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  const originURL = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="flex flex-col gap-8">
      <div className="grid-col grid w-full grid-cols-1 justify-between gap-x-12 gap-y-8 lg:grid-cols-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Authorization URL</h4>
          <Controller
            control={control}
            name="OIDC_URL_AUTHORIZATION"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="OIDC_URL_AUTHORIZATION"
                name="OIDC_URL_AUTHORIZATION"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.OIDC_URL_AUTHORIZATION)}
                placeholder="https://idp.your-company.com/o/authorize/"
                className="w-full rounded-md font-medium"
              />
            )}
          />
          <p className="text-xs text-custom-text-400">You will get this from your Identity Provider.</p>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Token URL</h4>
          <Controller
            control={control}
            name="OIDC_URL_TOKEN"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="OIDC_URL_TOKEN"
                name="OIDC_URL_TOKEN"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.OIDC_URL_TOKEN)}
                placeholder="https://idp.your-company.com/o/token/"
                className="w-full rounded-md font-medium"
              />
            )}
          />
          <p className="text-xs text-custom-text-400">You will get this from your Identity Provider.</p>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Userinfo URL</h4>
          <Controller
            control={control}
            name="OIDC_URL_USERINFO"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="OIDC_URL_USERINFO"
                name="OIDC_URL_USERINFO"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.OIDC_URL_USERINFO)}
                placeholder="https://idp.your-company.com/o/token/"
                className="w-full rounded-md font-medium"
              />
            )}
          />
          <p className="text-xs text-custom-text-400">You will get this from your Identity Provider.</p>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Client ID</h4>
          <Controller
            control={control}
            name="OIDC_CLIENT_ID"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="OIDC_CLIENT_ID"
                name="OIDC_CLIENT_ID"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.OIDC_CLIENT_ID)}
                placeholder="70a44354520df8bd9bcd"
                className="w-full rounded-md font-medium"
              />
            )}
          />
          <p className="text-xs text-custom-text-400">You will get this from your Identity Provider.</p>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Client secret</h4>
          <div className="relative">
            <Controller
              control={control}
              name="OIDC_CLIENT_SECRET"
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="OIDC_CLIENT_SECRET"
                  name="OIDC_CLIENT_SECRET"
                  type={showPassword ? "text" : "password"}
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.OIDC_CLIENT_SECRET)}
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

          <p className="text-xs text-custom-text-400">You will get this from your Identity Provider.</p>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Redirect URL</h4>
          <Button
            variant="neutral-primary"
            className="flex items-center justify-between py-2"
            onClick={() => {
              navigator.clipboard.writeText(originURL + "/*");
              setToastAlert({
                message: "The Redirect URL has been successfully copied to your clipboard",
                type: "success",
                title: "Copied to clipboard",
              });
            }}
          >
            <p className="text-sm font-medium">{originURL + "/*"}</p>
            <Copy size={18} color="#B9B9B9" />
          </Button>
          <p className="text-xs text-custom-text-400">
            We will auto-generate this. Paste this into the Redirect or Authorization callback URL field of your
            Identity Provider settings.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Logout URL (Optional)</h4>
          <Controller
            control={control}
            name="OIDC_URL_ENDSESSION"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="OIDC_URL_ENDSESSION"
                name="OIDC_URL_ENDSESSION"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.OIDC_URL_ENDSESSION)}
                placeholder="https://idp.your-company.com/o/end-session/"
                className="w-full rounded-md font-medium"
              />
            )}
          />
          <p className="text-xs text-custom-text-400">
            Instead of redirecting to the plane login page it will redirect to your Identity Provider using the Logout
            URL provided by your Identity Provider.
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
      <div className="mr-4 flex items-center gap-14">
        <div className="grow">
          <div className="text-sm font-medium text-custom-text-100">Automatically use OpenID Connect to SignIn</div>
          <div className="text-xs font-normal text-custom-text-300">
            Toggling this on will automatically redirect the user to your Identity Provider using OpenID Connect to sign
            in if they arent authenticated.
          </div>
        </div>
        <div className={`shrink-0 ${isSubmittingAuto && "opacity-70"}`}>
          <ToggleSwitch
            value={Boolean(parseInt(oidcAuto))}
            onChange={() => {
                Boolean(parseInt(oidcAuto)) ? updateConfig("OIDC_AUTO", "0") : updateConfig("OIDC_AUTO", "1");
            }}
            size="sm"
            disabled={isSubmittingAuto}
          />
        </div>
      </div>
    </div>
  );
};
