import { observer } from "mobx-react";
import { PROJECT_CREATED_AT_FILTER_OPTIONS } from "@plane/constants";
import { CloseIcon } from "@plane/propel/icons";
// helpers
import { renderFormattedDate, capitalizeFirstLetter } from "@plane/utils";
// constants

type Props = {
  editable: boolean | undefined;
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedDateFilters = observer(function AppliedDateFilters(props: Props) {
  const { editable, handleRemove, values } = props;

  const getDateLabel = (value: string): string => {
    let dateLabel = "";

    const dateDetails = PROJECT_CREATED_AT_FILTER_OPTIONS.find((d) => d.value === value);

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
        <div key={date} className="flex items-center gap-1 rounded-sm bg-layer-1 px-1.5 py-1 text-11">
          <span className="normal-case">{getDateLabel(date)}</span>
          {editable && (
            <button
              type="button"
              className="grid place-items-center text-tertiary hover:text-secondary"
              onClick={() => handleRemove(date)}
            >
              <CloseIcon height={10} width={10} strokeWidth={2} />
            </button>
          )}
        </div>
      ))}
    </>
  );
});
