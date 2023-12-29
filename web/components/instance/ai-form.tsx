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

export interface IInstanceAIForm {
  config: IFormattedInstanceConfiguration;
}

export interface AIFormValues {
  OPENAI_API_KEY: string;
  GPT_ENGINE: string;
}

export const InstanceAIForm: FC<IInstanceAIForm> = (props) => {
  const { config } = props;
  // states
  const [showPassword, setShowPassword] = useState(false);
  // store
  const { instance: instanceStore } = useApplication();
  // toast
  const { setToastAlert } = useToast();
  // form data
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AIFormValues>({
    defaultValues: {
      OPENAI_API_KEY: config["OPENAI_API_KEY"],
      GPT_ENGINE: config["GPT_ENGINE"],
    },
  });

  const onSubmit = async (formData: AIFormValues) => {
    const payload: Partial<AIFormValues> = { ...formData };

    await instanceStore
      .updateInstanceConfigurations(payload)
      .then(() =>
        setToastAlert({
          title: "Success",
          type: "success",
          message: "AI Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <>
      <div className="grid-col grid w-full grid-cols-1 items-center justify-between gap-x-16 gap-y-8 lg:grid-cols-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">GPT_ENGINE</h4>
          <Controller
            control={control}
            name="GPT_ENGINE"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="GPT_ENGINE"
                name="GPT_ENGINE"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.GPT_ENGINE)}
                placeholder="gpt-3.5-turbo"
                className="w-full rounded-md font-medium"
              />
            )}
          />
          <p className="text-xs text-custom-text-400">
            Choose an OpenAI engine.{" "}
            <a
              href="https://platform.openai.com/docs/models/overview"
              target="_blank"
              className="text-custom-primary-100 hover:underline"
              rel="noreferrer"
            >
              Learn more
            </a>
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <h4 className="text-sm">API key</h4>
          <div className="relative">
            <Controller
              control={control}
              name="OPENAI_API_KEY"
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="OPENAI_API_KEY"
                  name="OPENAI_API_KEY"
                  type={showPassword ? "text" : "password"}
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.OPENAI_API_KEY)}
                  placeholder="sk-asddassdfasdefqsdfasd23das3dasdcasd"
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
            You will find your API key{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              className="text-custom-primary-100 hover:underline"
              rel="noreferrer"
            >
              here.
            </a>
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
