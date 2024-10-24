import { observer } from "mobx-react";
import { Globe2, X, Lock } from "lucide-react";
// constants
import { NETWORK_CHOICES } from "@/constants/project";
import { TProjectAccess } from "@/plane-web/types/workspace-project-filters";

type Props = {
  handleRemove: (val: TProjectAccess) => void;
  appliedFilters: TProjectAccess[];
  editable: boolean | undefined;
};

export const AppliedAccessFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, appliedFilters, editable } = props;

  return (
    <>
      {appliedFilters.map((access) => {
        const accessDetails = NETWORK_CHOICES.find((a) => `${a.label.toLowerCase()}` == access);
        if (!accessDetails) return null;
        return (
          <div key={access} className="flex items-center gap-1 rounded p-1 text-xs bg-custom-background-80">
            {accessDetails.key === 0 ? <Globe2 className={`h-3 w-3`} /> : <Lock className={`h-3 w-3`} />}
            {accessDetails?.label}
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
