/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// helpers
import { DATE_AFTER_FILTER_OPTIONS } from "@plane/constants";
import { renderFormattedDate, capitalizeFirstLetter } from "@plane/utils";
import { RemovableChip } from "@/components/common/removable-chip";
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
      {values.map((date) => {
        const dateLabel = getDateLabel(date);

        return (
          <RemovableChip
            key={date}
            variant="soft"
            label={dateLabel}
            ariaLabel={dateLabel}
            onRemove={editable ? () => handleRemove(date) : undefined}
          />
        );
      })}
    </>
  );
});
