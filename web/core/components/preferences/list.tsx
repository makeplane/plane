import { PREFERENCE_OPTIONS } from "@plane/constants";
import { PREFERENCE_COMPONENTS } from "@/plane-web/components/preferences/config";

export const PreferencesList = () => (
  <div className="py-6 space-y-6">
    {PREFERENCE_OPTIONS.map((option) => {
      const Component = PREFERENCE_COMPONENTS[option.id as keyof typeof PREFERENCE_COMPONENTS];
      return <Component key={option.id} option={option} />;
    })}
  </div>
);
