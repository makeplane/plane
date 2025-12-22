import { PREFERENCE_OPTIONS } from "@plane/constants";
import { PREFERENCE_COMPONENTS } from "@/plane-web/components/preferences/config";

type PreferenceComponentKey = keyof typeof PREFERENCE_COMPONENTS;

export function PreferencesList() {
  return (
    <div className="py-6 space-y-6">
      {PREFERENCE_OPTIONS.map((option) => {
        const key = option.id as PreferenceComponentKey;
        const Component = PREFERENCE_COMPONENTS[key];
        if (!Component) return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <Component key={option.id} option={option as any} />;
      })}
    </div>
  );
}
