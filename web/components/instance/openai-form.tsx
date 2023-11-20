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

export interface IInstanceOpenAIForm {
  config: IFormattedInstanceConfiguration;
}

export interface OpenAIFormValues {
  OPENAI_API_BASE: string;
  OPENAI_API_KEY: string;
  GPT_ENGINE: string;
}

export const InstanceOpenAIForm: FC<IInstanceOpenAIForm> = (props) => {
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
  } = useForm<OpenAIFormValues>({
    defaultValues: {
      OPENAI_API_BASE: config["OPENAI_API_BASE"],
      OPENAI_API_KEY: config["OPENAI_API_KEY"],
      GPT_ENGINE: config["GPT_ENGINE"],
    },
  });

  const onSubmit = async (formData: OpenAIFormValues) => {
    const payload: Partial<OpenAIFormValues> = { ...formData };

    await instanceStore
      .updateInstanceConfigurations(payload)
      .then(() =>
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Open AI Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <div className="flex flex-col gap-8 m-8 w-4/5">
      <div className="pb-2 mb-2 border-b border-custom-border-100">
        <div className="text-custom-text-100 font-medium text-lg">OpenAI</div>
        <div className="text-custom-text-300 font-normal text-sm">
          AI is everywhere make use it as much as you can! <a href="#" className="text-custom-primary-100">Learn more.</a>
        </div>
      </div>
      <div className="grid grid-col grid-cols-1 lg:grid-cols-2 items-center justify-between gap-x-16 gap-y-8 w-full">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">OpenAI API Base</h4>
          <Controller
            control={control}
            name="OPENAI_API_BASE"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="OPENAI_API_BASE"
                name="OPENAI_API_BASE"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.OPENAI_API_BASE)}
                placeholder="OpenAI API Base"
                className="rounded-md font-medium w-full"
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-1">
          <h4 className="text-sm">OpenAI API Key</h4>
          <Controller
            control={control}
            name="OPENAI_API_KEY"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="OPENAI_API_KEY"
                name="OPENAI_API_KEY"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.OPENAI_API_KEY)}
                placeholder="OpenAI API Key"
                className="rounded-md font-medium w-full"
              />
            )}
          />
        </div>
      </div>
      <div className="grid grid-col grid-cols-1 lg:grid-cols-2 items-center justify-between gap-x-16 gap-y-8 w-full">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">GPT Engine</h4>
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
                placeholder="GPT Engine"
                className="rounded-md font-medium w-full"
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
