import { observer } from "mobx-react";
// constants
import { NETWORK_CHOICES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedAccessFilters = observer(function AppliedAccessFilters(props: Props) {
  const { handleRemove, values, editable } = props;
  const { t } = useTranslation();

  return (
    <>
      {values.map((status) => {
        const accessDetails = NETWORK_CHOICES.find((s) => `${s.key}` === status);
        return (
          <div key={status} className="flex items-center gap-1 rounded-sm px-1.5 py-1 text-11 bg-layer-1">
            {accessDetails && t(accessDetails?.i18n_label)}
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
