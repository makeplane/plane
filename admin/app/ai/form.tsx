import { FC } from "react";
import { useForm } from "react-hook-form";
import { Lightbulb } from "lucide-react";
import { IFormattedInstanceConfiguration, TInstanceAIConfigurationKeys } from "@plane/types";
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ControllerInput, TControllerInputFormField } from "@/components/common";
// hooks
import { useInstance } from "@/hooks/store";

type IInstanceAIForm = {
  config: IFormattedInstanceConfiguration;
};

type AIFormValues = Record<TInstanceAIConfigurationKeys, string>;

export const InstanceAIForm: FC<IInstanceAIForm> = (props) => {
  const { config } = props;
  // store
  const { updateInstanceConfigurations } = useInstance();
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

  const aiFormFields: TControllerInputFormField[] = [
    {
      key: "GPT_ENGINE",
      type: "text",
      label: "GPT_ENGINE",
      description: (
        <>
          Choose an OpenAI engine.{" "}
          <a
            href="https://platform.openai.com/docs/models/overview"
            target="_blank"
            className="text-custom-primary-100 hover:underline"
            rel="noreferrer"
          >
            Learn more
          </a>
        </>
      ),
      placeholder: "gpt-3.5-turbo",
      error: Boolean(errors.GPT_ENGINE),
      required: false,
    },
    {
      key: "OPENAI_API_KEY",
      type: "password",
      label: "API key",
      description: (
        <>
          You will find your API key{" "}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            className="text-custom-primary-100 hover:underline"
            rel="noreferrer"
          >
            here.
          </a>
        </>
      ),
      placeholder: "sk-asddassdfasdefqsdfasd23das3dasdcasd",
      error: Boolean(errors.OPENAI_API_KEY),
      required: false,
    },
  ];

  const onSubmit = async (formData: AIFormValues) => {
    const payload: Partial<AIFormValues> = { ...formData };

    await updateInstanceConfigurations(payload)
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "AI Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div>
          <div className="pb-1 text-xl font-medium text-custom-text-100">OpenAI</div>
          <div className="text-sm font-normal text-custom-text-300">If you use ChatGPT, this is for you.</div>
        </div>
        <div className="grid-col grid w-full grid-cols-1 items-center justify-between gap-x-12 gap-y-8 lg:grid-cols-3">
          {aiFormFields.map((field) => (
            <ControllerInput
              key={field.key}
              control={control}
              type={field.type}
              name={field.key}
              label={field.label}
              description={field.description}
              placeholder={field.placeholder}
              error={field.error}
              required={field.required}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>

        <div className="relative inline-flex items-center gap-2 rounded border border-custom-primary-100/20 bg-custom-primary-100/10 px-4 py-2 text-xs text-custom-primary-200">
          <Lightbulb height="14" width="14" />
          <div>If you have a preferred AI models vendor, please get in touch with us.</div>
        </div>
      </div>
    </div>
  );
};
