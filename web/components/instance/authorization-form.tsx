import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input, ToggleSwitch } from "@plane/ui";
import { Disclosure, Transition } from "@headlessui/react";
// types
import { IFormattedInstanceConfiguration } from "types/instance";
// hooks
import useToast from "hooks/use-toast";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// icons
import { ChevronDown, ChevronRight, Copy } from "lucide-react";

export interface IInstanceAuthorizationForm {
  config: IFormattedInstanceConfiguration;
}

export interface AuthorizationFormValues {
  ENABLE_SIGNUP: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export const InstanceAuthorizationForm: FC<IInstanceAuthorizationForm> = (props) => {
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
  } = useForm<AuthorizationFormValues>({
    defaultValues: {
      ENABLE_SIGNUP: config["ENABLE_SIGNUP"],
      GOOGLE_CLIENT_ID: config["GOOGLE_CLIENT_ID"],
      GOOGLE_CLIENT_SECRET: config["GOOGLE_CLIENT_SECRET"],
      GITHUB_CLIENT_ID: config["GITHUB_CLIENT_ID"],
      GITHUB_CLIENT_SECRET: config["GITHUB_CLIENT_SECRET"],
    },
  });

  const onSubmit = async (formData: AuthorizationFormValues) => {
    const payload: Partial<AuthorizationFormValues> = { ...formData };

    await instanceStore
      .updateInstanceConfigurations(payload)
      .then(() =>
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Authorization Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  const originURL = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="flex flex-col gap-8 m-8 w-4/5">
      <div className="flex items-center gap-8 pb-4 border-b border-custom-border-100">
        <div>
          <div className="text-custom-text-100 font-medium text-sm">Enable sign-up</div>
          <div className="text-custom-text-300 font-normal text-xs">
            Keep the doors open so people can join your workspaces.
          </div>
        </div>
        <div>
          <Controller
            control={control}
            name="ENABLE_SIGNUP"
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

      <div className="flex flex-col gap-y-6 py-2">
        <Disclosure as="div">
          {({ open }) => (
            <div className="w-full">
              <Disclosure.Button
                as="button"
                type="button"
                className="flex items-center justify-between w-full py-2 border-b border-custom-border-100"
              >
                <span className="text-lg font-medium tracking-tight">Google</span>
                {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </Disclosure.Button>

              <Transition
                show={open}
                enter="transition duration-100 ease-out"
                enterFrom="transform opacity-0"
                enterTo="transform opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform opacity-100"
                leaveTo="transform opacity-0"
              >
                <Disclosure.Panel className="flex flex-col gap-8 px-2 py-8">
                  <div className="grid grid-col grid-cols-1 lg:grid-cols-2 items-center justify-between gap-x-16 gap-y-8 w-full">
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
                            placeholder="Google Client ID"
                            className="rounded-md font-medium w-full"
                          />
                        )}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm">Client Secret</h4>
                      <Controller
                        control={control}
                        name="GOOGLE_CLIENT_SECRET"
                        render={({ field: { value, onChange, ref } }) => (
                          <Input
                            id="GOOGLE_CLIENT_SECRET"
                            name="GOOGLE_CLIENT_SECRET"
                            type="text"
                            value={value}
                            onChange={onChange}
                            ref={ref}
                            hasError={Boolean(errors.GOOGLE_CLIENT_SECRET)}
                            placeholder="Google Client Secret"
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
                      <p className="text-xs text-custom-text-400/60">
                        *paste this URL in your Google developer console.
                      </p>
                    </div>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
        <Disclosure as="div">
          {({ open }) => (
            <div className="w-full">
              <Disclosure.Button
                as="button"
                type="button"
                className="flex items-center justify-between w-full py-2 border-b border-custom-border-100"
              >
                <span className="text-lg font-medium tracking-tight">Github</span>
                {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </Disclosure.Button>

              <Transition
                show={open}
                enter="transition duration-100 ease-out"
                enterFrom="transform opacity-0"
                enterTo="transform opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform opacity-100"
                leaveTo="transform opacity-0"
              >
                <Disclosure.Panel className="flex flex-col gap-8 px-2 py-8">
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
                      <p className="text-xs text-custom-text-400/60">
                        *paste this URL in your Github console.
                      </p>
                    </div>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
      </div>

      <div className="flex items-center py-2">
        <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
