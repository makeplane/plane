import { range } from "lodash-es";
import { useTranslation } from "@plane/i18n";
export function APITokenSettingsLoader() {
  const { t } = useTranslation();
  return (
    <section className="w-full overflow-y-auto">
      <div className="mb-2 flex items-center justify-between border-b border-subtle pb-3.5">
        <h3 className="text-18 font-medium">{t("workspace_settings.settings.api_tokens.title")}</h3>
        <span className="h-8 w-28 bg-layer-1 rounded-sm" />
      </div>
      <div className="divide-y-[0.5px] divide-subtle-1">
        {range(2).map((i) => (
          <div key={i} className="flex flex-col gap-2 py-3">
            <div className="flex items-center gap-2">
              <span className="h-5 w-28 bg-layer-1 rounded-sm" />
              <span className="h-5 w-16 bg-layer-1 rounded-sm" />
            </div>
            <span className="h-5 w-36 bg-layer-1 rounded-sm" />
          </div>
        ))}
      </div>
    </section>
  );
}
