import { Control, Controller } from "react-hook-form";
import { IExtendedWebhook } from "types/webhook";
import { IWebhookOptions } from "./WebHookTypes";

export enum WebhookTypes {
  ALL = "all",
  INDIVIDUAL = "individual",
}

interface IWebHookOptions {
  control: Control<IExtendedWebhook, any>;
}

export const WEBHOOK_EVENTS = "webhook_events";

const webhookOptions: IWebhookOptions[] = [
  {
    key: WebhookTypes.ALL,
    label: "Send everything",
    name: WEBHOOK_EVENTS,
  },
  {
    key: WebhookTypes.INDIVIDUAL,
    label: "Select Individual events",
    name: WEBHOOK_EVENTS,
  },
];

export const WebHookOptions = ({ control }: IWebHookOptions) => {
  return (
    <>
      <div className="text-sm font-medium">Which events do you like to trigger this webhook</div>
      {webhookOptions.map(({ key, label, name }: IWebhookOptions) => {
        return (
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name={name}
              key={key}
              render={({ field: { onChange, value } }) => (
                <input
                  id={key}
                  type="radio"
                  name={name}
                  value={key}
                  checked={value == key}
                  onChange={() => onChange(key)}
                />
              )}
            />
            <label className="text-sm" htmlFor={key}>
              {label}
            </label>
          </div>
        );
      })}
    </>
  );
};
