// constants
import { LOCALES } from "constants/locales";
// ui
import { CustomSelect } from "components/ui";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { useState } from "react";

export const LocaleSwitch: React.FC = observer(({}) => {
  const store: any = useMobxStore();
  const [localeBase] = useState(store.locale.locale);

  const updateLocale = (newLocale: string) => {
    if (store.locale.locale === newLocale) return;
    store.locale.setLocale(newLocale);
  };

  const currentLocaleObj = LOCALES.find((t) => t.value === store.locale.locale);

  return (
    <div>
      <CustomSelect
        value={store.locale.locale}
        label={
          currentLocaleObj ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">{currentLocaleObj.icon}</div>
              <div className="flex items-center gap-2">{currentLocaleObj.label}</div>
            </div>
          ) : (
            "Select your language"
          )
        }
        onChange={({ value }: { value: string }) => updateLocale(value)}
        input
        width="w-full"
        position="right"
      >
        {LOCALES.map(({ value, label, icon }) => (
          <CustomSelect.Option key={value} value={{ value }}>
            <div className="flex items-center gap-2">{icon}</div>
            <div className="flex items-center gap-2">{label}</div>
          </CustomSelect.Option>
        ))}
      </CustomSelect>
      {localeBase !== store.locale.locale && (
        <a href="" className="text-xs text-gray-500 mt-1">
          Reload the page to apply changes
        </a>
      )}
    </div>
  );
});
