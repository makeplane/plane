import { observer } from "mobx-react";
// ui
import { MODULE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CloseIcon, ModuleStatusIcon } from "@plane/propel/icons";
// constants

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedStatusFilters = observer(function AppliedStatusFilters(props: Props) {
  const { handleRemove, values, editable } = props;
  const { t } = useTranslation();

  return (
    <>
      {values.map((status) => {
        const statusDetails = MODULE_STATUS?.find((s) => s.value === status);
        if (!statusDetails) return null;

        return (
          <div key={status} className="flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <ModuleStatusIcon status={statusDetails.value} height="12px" width="12px" />
            {t(statusDetails.i18n_label)}
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-tertiary hover:text-secondary"
                onClick={() => handleRemove(status)}
              >
                <CloseIcon height={10} width={10} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
});
