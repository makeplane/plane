import React, { FC, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button, Input, ToggleSwitch } from "@plane/ui";
import { IWebhook, IExtendedWebhook } from "types";
import { GenerateKey } from "./generate-key";
import { observer } from "mobx-react-lite";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

interface IWebhookDetails {
  type: 'create' | 'edit'
  initialData: IWebhook;
  onSubmit: (val: IExtendedWebhook) => Promise<IWebhook>;
}

export const WebhookDetails: FC<IWebhookDetails> = observer((props) => {
  const { type, initialData, onSubmit } = props;
  const { webhook: webhookStore }: RootStore = useMobxStore()

  const { reset, watch, handleSubmit, control, getValues, formState: { isSubmitting } } = useForm<IExtendedWebhook>();

  useEffect(() => {
    if (initialData && reset) reset({ ...initialData, webhook_events: "all" });
  }, [initialData, reset]);

  useEffect(() => {
    if (watch("webhook_events")) {
      if (watch("webhook_events") === "all")
        reset({ ...getValues(), project: true, module: true, cycle: true, issue: true, issue_comment: true });
      if (watch("webhook_events") === "individual") reset({ ...getValues(), project: false, module: false, cycle: false, issue: false, issue_comment: false });
    }
  }, [watch && watch("webhook_events")]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-8">
        <div>
          <div className="font-medium text-sm">URL</div>
          <Controller
            control={control}
            name="url"
            render={({ field: { onChange, value } }) => (
              <Input
                className="w-full"
                onChange={onChange}
                value={value}
                id="url"
                autoComplete="off"
                placeholder="Enter URL"
              />
            )}
          />
        </div>

        <div className="flex gap-6">
          <div className="text-sm"> Enable webhook</div>
          <Controller
            control={control}
            name="is_active"
            render={({ field: { onChange, value } }) => (
              <ToggleSwitch
                value={value}
                onChange={(val) => {
                  onChange(val);
                }}
                size="sm"
              />
            )}
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Which events do you like to trigger this webhook</div>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="webhook_events"
              render={({ field: { onChange, value } }) => (
                <input
                  id="all"
                  type="radio"
                  name="webhook_events"
                  value="all"
                  checked={value == "all"}
                  onChange={() => onChange("all")}
                />
              )}
            />
            <label className="text-sm" htmlFor="all">
              Send everything
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="webhook_events"
              render={({ field: { onChange, value } }) => (
                <input
                  id="individual"
                  type="radio"
                  name="webhook_events"
                  value="individual"
                  checked={value == "individual"}
                  onChange={() => onChange("individual")}
                />
              )}
            />
            <label className="text-sm" htmlFor="individual">
              Select Individual events
            </label>
          </div>

          {watch("webhook_events") === "individual" && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 grid-flow-row gap-4 px-8 py-6 bg-custom-background-90">
                <Controller
                  control={control}
                  name="project"
                  render={({ field: { onChange, value } }) => (
                    <div className="relative flex items-center gap-2">
                      <input
                        id="project_toggle"
                        onChange={() => onChange(!value)}
                        type="checkbox"
                        name="selectIndividualEvents"
                      />
                      <label className="text-sm" htmlFor="project_toggle">
                        Project
                      </label>
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name="cycle"
                  render={({ field: { onChange, value } }) => (
                    <div className="flex items-center gap-2">
                      <input
                        id="cycle-toggle"
                        onChange={() => onChange(!value)}
                        type="checkbox"
                        name="selectIndividualEvents"
                      />
                      <label className="text-sm" htmlFor="cycle-toggle">
                        Cycles
                      </label>
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name="issue"
                  render={({ field: { onChange, value } }) => (
                    <div className="flex items-center gap-2">
                      <input
                        id="issue_toggle"
                        onChange={() => onChange(!value)}
                        type="checkbox"
                        name="selectIndividualEvents"
                      />
                      <label className="text-sm" htmlFor="issue_toggle">
                        Issues
                      </label>
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name="module"
                  render={({ field: { onChange, value } }) => (
                    <div className="flex items-center gap-2">
                      <input
                        id="module_toggle"
                        onChange={() => onChange(!value)}
                        type="checkbox"
                        name="selectIndividualEvents"
                      />
                      <label className="text-sm" htmlFor="module_toggle">
                        Module
                      </label>
                    </div>
                  )}
                />

                <Controller
                  control={control}
                  name="issue_comment"
                  render={({ field: { onChange, value } }) => (
                    <div className="flex items-center gap-2">
                      <input
                        id="issue_comment_toggle"
                        onChange={() => onChange(!value)}
                        type="checkbox"
                        name="selectIndividualEvents"
                      />
                      <label className="text-sm" htmlFor="issue_comment_toggle">
                        Issue Comment
                      </label>
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        </div>

        <GenerateKey type={type} />

        {!webhookStore?.webhookSecretKey && (
          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'processing...' : 'Save webhook'}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
});
