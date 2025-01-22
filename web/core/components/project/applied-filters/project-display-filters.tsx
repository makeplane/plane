import { observer } from "mobx-react";
// icons
import { X } from "lucide-react";
// types
import { PROJECT_DISPLAY_FILTER_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TProjectAppliedDisplayFilterKeys } from "@plane/types";
// constants

type Props = {
  handleRemove: (key: TProjectAppliedDisplayFilterKeys) => void;
  values: TProjectAppliedDisplayFilterKeys[];
  editable: boolean | undefined;
};

export const AppliedProjectDisplayFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values, editable } = props;
  const { t } = useTranslation();

  return (
    <>
      {values.map((key) => {
        const filterLabel = PROJECT_DISPLAY_FILTER_OPTIONS.find((s) => s.key === key)?.i18n_label;
        return (
          <div key={key} className="flex items-center gap-1 rounded px-1.5 py-1 text-xs bg-custom-background-80">
            {filterLabel && t(filterLabel)}
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                onClick={() => handleRemove(key)}
              >
                <X size={10} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
});
