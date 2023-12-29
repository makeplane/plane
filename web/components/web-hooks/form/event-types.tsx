// types
import { TWebhookEventTypes } from "@plane/types";

type Props = {
  value: string;
  onChange: (value: TWebhookEventTypes) => void;
};

const WEBHOOK_EVENT_TYPES: { key: TWebhookEventTypes; label: string }[] = [
  {
    key: "all",
    label: "Send me everything",
  },
  {
    key: "individual",
    label: "Select individual events",
  },
];

export const WebhookOptions: React.FC<Props> = (props) => {
  const { value, onChange } = props;

  return (
    <>
      <h6 className="text-sm font-medium">Which events would you like to trigger this webhook?</h6>
      <div className="space-y-3">
        {WEBHOOK_EVENT_TYPES.map((option) => (
          <div key={option.key} className="flex items-center gap-2">
            <input
              id={option.key}
              type="radio"
              value={option.key}
              checked={value == option.key}
              onChange={() => onChange(option.key)}
            />
            <label className="text-sm" htmlFor={option.key}>
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </>
  );
};
