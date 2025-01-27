import { observer } from "mobx-react";
// icons
import { X } from "lucide-react";
// constants
import { EViewAccess } from "@plane/constants";
// helpers
import { useTranslation } from "@plane/i18n";
import { VIEW_ACCESS_SPECIFIERS } from "@/helpers/views.helper";

type Props = {
  editable: boolean | undefined;
  handleRemove: (val: EViewAccess) => void;
  values: EViewAccess[];
};

export const AppliedAccessFilters: React.FC<Props> = observer((props) => {
  const { editable, handleRemove, values } = props;
  const { t } = useTranslation();

  const getAccessLabel = (val: EViewAccess) => {
    const value = VIEW_ACCESS_SPECIFIERS.find((option) => option.key === val);
    return value?.i18n_label;
  };

  return (
    <>
      {values.map((access) => {
        const label = getAccessLabel(access);

        if (!label) return null;

        return (
          <div key={access} className="flex items-center gap-1 rounded bg-custom-background-80 py-1 px-1.5 text-xs">
            <span className="normal-case">{t(label)}</span>
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                onClick={() => handleRemove(access)}
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
