import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { IWebhook, IExtendedWebhook } from "types";
import { GenerateKey } from "./generate-key";
import { observer } from "mobx-react-lite";
// components
import { DeleteWebhookModal } from "../delete-webhook-modal";
import { WebHookInput } from "./input";
import { WebHookToggle } from "./toggle";
import { WEBHOOK_EVENTS, WebHookOptions, WebhookTypes } from "./options";
import { WebHookIndividualOptions, individualWebhookOptions } from "./option";
import { WebHookSubmitButton } from "./submit";
import { WebHookEditForm } from "./edit-form";

export enum WebHookFormTypes {
  EDIT = "edit",
  CREATE = "create",
}

interface IWebHookForm {
  type: WebHookFormTypes;
  initialData: IWebhook;
  onSubmit: (val: IExtendedWebhook) => void;
}

export const WebHookForm: FC<IWebHookForm> = observer((props) => {
  const { type, initialData, onSubmit } = props;
  // states
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  // use form
  const {
    reset,
    watch,
    handleSubmit,
    control,
    getValues,
    formState: { isSubmitting, errors },
  } = useForm<IExtendedWebhook>();

  const checkWebhookEvent = (initialData: IWebhook) => {
    const { project, module, cycle, issue, issue_comment } = initialData;
    if (!project || !cycle || !module || !issue || !issue_comment) {
      return WebhookTypes.INDIVIDUAL;
    }
    return WebhookTypes.ALL;
  };

  useEffect(() => {
    if (initialData && reset) reset({ ...initialData, webhook_events: checkWebhookEvent(initialData) });
  }, [initialData, reset]);

  useEffect(() => {
    if (!watch(WEBHOOK_EVENTS)) return;

    const allWebhookOptions: { [key: string]: boolean } = {};

    /**For Webhooks to return all the types */
    if (watch(WEBHOOK_EVENTS) === WebhookTypes.ALL) {
      individualWebhookOptions.forEach(({ name }) => {
        allWebhookOptions[name] = true;
      });
    } /**For Webhooks to return selected individual types, retain the saved individual types */ else if (
      watch(WEBHOOK_EVENTS) === WebhookTypes.INDIVIDUAL
    ) {
      individualWebhookOptions.forEach(({ name }) => {
        if (initialData[name] !== undefined) {
          allWebhookOptions[name] = initialData[name]!;
        } else {
          allWebhookOptions[name] = true;
        }
      });
    }

    reset({ ...getValues(), ...allWebhookOptions });
  }, [watch && watch(WEBHOOK_EVENTS)]);

  return (
    <>
      <DeleteWebhookModal
        isOpen={openDeleteModal}
        webhook_url=""
        onClose={() => {
          setOpenDeleteModal(false);
        }}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-8 py-5">
          <WebHookInput control={control} errors={errors} />
          <WebHookToggle control={control} />
          <div className="space-y-3">
            <WebHookOptions control={control} />
            {watch(WEBHOOK_EVENTS) === WebhookTypes.INDIVIDUAL && <WebHookIndividualOptions control={control} />}
          </div>
          <GenerateKey type={type} />
          <WebHookSubmitButton isSubmitting={isSubmitting} type={type} />
          {type === WebHookFormTypes.EDIT && <WebHookEditForm setOpenDeleteModal={setOpenDeleteModal} />}
        </div>
      </form>
    </>
  );
});
