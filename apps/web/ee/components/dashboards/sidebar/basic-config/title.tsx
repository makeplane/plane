// plane imports
import { useTranslation } from "@plane/i18n";
import { Input } from "@plane/ui";

type Props = {
  onChange: (value: string) => void;
  value: string | undefined;
};

export const WidgetConfigSidebarTitle: React.FC<Props> = (props) => {
  const { onChange, value } = props;
  // translation
  const { t } = useTranslation();

  return (
    <div className="flex-shrink-0 space-y-2">
      <label htmlFor="widget-title" className="text-sm font-medium text-custom-text-200">
        {t("dashboards.widget.common.widget_title.label")}
      </label>
      <Input
        id="widget-title"
        type="text"
        className="w-full"
        placeholder={t("dashboards.widget.common.widget_title.placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={255}
        required
      />
    </div>
  );
};
