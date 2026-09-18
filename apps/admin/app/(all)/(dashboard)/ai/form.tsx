/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useForm } from "react-hook-form";
import { Button } from "@makeplane/propel/components/button";
import type { IFormattedInstanceConfiguration, TInstanceAIConfigurationKeys } from "@plane/types";
// components
import type { TControllerInputFormField } from "@/components/common/controller-input";
import { ControllerInput } from "@/components/common/controller-input";
import { TOAST_TYPE, setToast } from "@/providers/toast";
// hooks
import { useInstance } from "@/hooks/store";

type IInstanceAIForm = {
  config: IFormattedInstanceConfiguration;
};

type AIFormValues = Record<TInstanceAIConfigurationKeys, string>;

export function InstanceAIForm(props: IInstanceAIForm) {
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
      LLM_API_KEY: config["LLM_API_KEY"],
      LLM_BASE_URL: config["LLM_BASE_URL"],
      LLM_MODEL: config["LLM_MODEL"],
    },
  });

  const aiFormFields: TControllerInputFormField<AIFormValues>[] = [
    {
      key: "LLM_BASE_URL",
      type: "text",
      label: "AI gateway base URL",
      description: "OpenAI-compatible endpoint served by your private AI gateway.",
      placeholder: "https://ai-gateway.internal/v1",
      error: Boolean(errors.LLM_BASE_URL),
      required: false,
    },
    {
      key: "LLM_API_KEY",
      type: "password",
      label: "API key",
      description: "Credential issued by your private AI gateway.",
      placeholder: "sk-asddassdfasdefqsdfasd23das3dasdcasd",
      error: Boolean(errors.LLM_API_KEY),
      required: false,
    },
    {
      key: "LLM_MODEL",
      type: "text",
      label: "LLM model",
      description: "Model name exposed by your private AI gateway.",
      placeholder: "internal-chat-model",
      error: Boolean(errors.LLM_MODEL),
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
          <div className="pb-1 text-18 font-medium text-primary">Private AI gateway</div>
          <div className="text-13 font-regular text-tertiary">OpenAI-compatible API credentials.</div>
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

      <div className="flex flex-col items-start gap-4">
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          onClick={handleSubmit(onSubmit)}
          loading={isSubmitting}
          label={isSubmitting ? "Saving" : "Save changes"}
        />
      </div>
    </div>
  );
}
