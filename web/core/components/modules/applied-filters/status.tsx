"use client";

import { observer } from "mobx-react";
import { X } from "lucide-react";
// ui
import { MODULE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ModuleStatusIcon } from "@plane/ui";
// constants

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedStatusFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values, editable } = props;
  const { t } = useTranslation();

  return (
    <>
      {values.map((status) => {
        const statusDetails = MODULE_STATUS?.find((s) => s.value === status);
        if (!statusDetails) return null;

        return (
          <div key={status} className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
            <ModuleStatusIcon status={statusDetails.value} height="12px" width="12px" />
            {t(statusDetails.i18n_label)}
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                onClick={() => handleRemove(status)}
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
