// types
import { useTranslation } from "@plane/i18n";
import type { TWebhookEventTypes } from "@plane/types";

type Props = {
  value: string;
  onChange: (value: TWebhookEventTypes) => void;
};

const WEBHOOK_EVENT_TYPES: { key: TWebhookEventTypes; i18n_label: string }[] = [
  {
    key: "all",
    i18n_label: "workspace_settings.settings.webhooks.options.all",
  },
  {
    key: "individual",
    i18n_label: "workspace_settings.settings.webhooks.options.individual",
  },
];

export function WebhookOptions(props: Props) {
  const { value, onChange } = props;
  const { t } = useTranslation();

  return (
    <>
      <h6 className="text-13 font-medium">{t("workspace_settings.settings.webhooks.modal.question")}</h6>
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
            <label className="text-13" htmlFor={option.key}>
              {t(option.i18n_label)}
            </label>
          </div>
        ))}
      </div>
    </>
  );
}
