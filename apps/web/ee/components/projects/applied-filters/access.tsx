import { observer } from "mobx-react";
import { Globe2, X, Lock } from "lucide-react";
// plane imports
import { NETWORK_CHOICES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TProjectAccess } from "@/plane-web/types/workspace-project-filters";

type Props = {
  handleRemove: (val: TProjectAccess) => void;
  appliedFilters: TProjectAccess[];
  editable: boolean | undefined;
};

export const AppliedAccessFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, appliedFilters, editable } = props;
  // plane imports
  const { t } = useTranslation();
  return (
    <>
      {appliedFilters.map((access) => {
        const accessDetails = NETWORK_CHOICES.find((a) => `${a.labelKey.toLowerCase()}` == access);
        if (!accessDetails) return null;
        return (
          <div key={access} className="flex items-center gap-1 rounded p-1 text-xs bg-custom-background-80">
            {accessDetails.key === 0 ? <Globe2 className={`h-3 w-3`} /> : <Lock className={`h-3 w-3`} />}
            {t(accessDetails.i18n_label)}
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
