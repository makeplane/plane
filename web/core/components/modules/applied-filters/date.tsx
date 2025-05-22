import { observer } from "mobx-react";
// icons
import { X } from "lucide-react";
import { DATE_AFTER_FILTER_OPTIONS } from "@plane/constants";
import { renderFormattedDate, capitalizeFirstLetter } from "@plane/utils";
// helpers
// constants

type Props = {
  editable: boolean | undefined;
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedDateFilters: React.FC<Props> = observer((props) => {
  const { editable, handleRemove, values } = props;

  const getDateLabel = (value: string): string => {
    let dateLabel = "";

    const dateDetails = DATE_AFTER_FILTER_OPTIONS.find((d) => d.value === value);

    if (dateDetails) dateLabel = dateDetails.name;
    else {
      const dateParts = value.split(";");

      if (dateParts.length === 2) {
        const [date, time] = dateParts;

        dateLabel = `${capitalizeFirstLetter(time)} ${renderFormattedDate(date)}`;
      }
    }

    return dateLabel;
  };

  return (
    <>
      {values.map((date) => (
        <div key={date} className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
          <span className="normal-case">{getDateLabel(date)}</span>
          {editable && (
            <button
              type="button"
              className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
              onClick={() => handleRemove(date)}
            >
              <X size={10} strokeWidth={2} />
            </button>
          )}
        </div>
      ))}
    </>
  );
});
