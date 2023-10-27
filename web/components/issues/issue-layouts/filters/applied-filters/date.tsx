import { observer } from "mobx-react-lite";

// icons
import { X } from "lucide-react";
// helpers
import { renderLongDateFormat } from "helpers/date-time.helper";
import { capitalizeFirstLetter } from "helpers/string.helper";
// constants
import { DATE_FILTER_OPTIONS } from "constants/filters";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedDateFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values } = props;

  const getDateLabel = (value: string): string => {
    let dateLabel = "";

    const dateDetails = DATE_FILTER_OPTIONS.find((d) => d.value === value);

    if (dateDetails) dateLabel = dateDetails.name;
    else {
      const dateParts = value.split(";");

      if (dateParts.length === 2) {
        const [date, time] = dateParts;

        dateLabel = `${capitalizeFirstLetter(time)} ${renderLongDateFormat(date)}`;
      }
    }

    return dateLabel;
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {values.map((date) => (
        <div key={date} className="text-xs flex items-center gap-1 bg-custom-background-80 p-1 rounded">
          <span className="normal-case">{getDateLabel(date)}</span>
          <button
            type="button"
            className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
            onClick={() => handleRemove(date)}
          >
            <X size={10} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
});
