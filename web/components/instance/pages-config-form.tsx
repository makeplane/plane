import { FC, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
// ui
import { Button, Input } from "@plane/ui";
// types
import { IFormattedInstanceConfiguration } from "@plane/types";
// hooks
import { useApplication } from "hooks/store";
import useToast from "hooks/use-toast";

export interface IInstancePagesConfigForm {
  config: IFormattedInstanceConfiguration;
}

export interface PagesConfigFormValues {
  OUTLINE_API_TOKEN: string;
}

export const InstancePagesConfigForm: FC<IInstancePagesConfigForm> = (props) => {
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
  } = useForm<PagesConfigFormValues>({
    defaultValues: {
      OUTLINE_API_TOKEN: config["OUTLINE_API_TOKEN"],
    },
  });

  const onSubmit = async (formData: PagesConfigFormValues) => {
    const payload: Partial<PagesConfigFormValues> = { ...formData };

    await instanceStore
      .updateInstanceConfigurations(payload)
      .then(() =>
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Pages Configuration Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <>
      <div className="grid-col grid w-full grid-cols-1 items-center justify-between gap-x-16 gap-y-8 lg:grid-cols-2">
        <div className="flex max-w-md flex-col gap-1">
          <h4 className="text-sm">API Token from your Outline instance</h4>
          <div className="relative">
            <Controller
              control={control}
              name="OUTLINE_API_TOKEN"
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="OUTLINE_API_TOKEN"
                  name="OUTLINE_API_TOKEN"
                  type={showPassword ? "text" : "password"}
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.OUTLINE_API_TOKEN)}
                  placeholder="oXgq-sdfadsaeweqasdfasdf3234234rassd"
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
            Visit the Outline docs to learn how to create an API token.{" "}
            <a
              href="https://unsplash.com/documentation#creating-a-developer-account"
              target="_blank"
              className="text-custom-primary-100 hover:underline"
              rel="noreferrer"
            >
              Learn more.
            </a>
          </p>
          <p className="text-xs text-custom-text-400">
          In the Webhooks section of Outline (https://docs.getoutline.com/s/guide/doc/webhooks-gB7HYhS6yq), add the following webhook:
            <pre
              className="text-custom-primary-100 hover:underline"
            >
              {"<your-plane-domain>/api/webhooks/outline"}
            </pre>
          </p>
        </div>
      </div>

      <div className="flex items-center py-1">
        <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </>
  );
};
