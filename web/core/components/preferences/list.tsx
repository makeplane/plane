import { observer } from "mobx-react";
import { PREFERENCE_OPTIONS } from "./config";
import { PreferencesSection } from "./section";

export const PreferencesList = observer(() => {
  console.log("list");
  return (
    <div className="space-y-6">
      {PREFERENCE_OPTIONS.map((option) => {
        const Component = option.component;
        return <Component key={option.id} option={option} />;
        return (
          <PreferencesSection
            key={option.id}
            title={option.title}
            description={option.description}
            control={<Component />}
          />
        );
      })}
    </div>
  );
});
