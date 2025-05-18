import { observer } from "mobx-react";
import { PREFERENCE_OPTIONS } from "./config";

export const PreferencesList = observer(() => (
  <div className="space-y-6">
    {PREFERENCE_OPTIONS.map((option) => {
      const Component = option.component;
      return <Component key={option.id} option={option} />;
    })}
  </div>
));
