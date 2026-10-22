/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// icons
import { DATE_AFTER_FILTER_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
import { renderFormattedDate, capitalizeFirstLetter } from "@plane/utils";
// helpers
// constants

type Props = {
  editable: boolean | undefined;
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedDateFilters = observer(function AppliedDateFilters(props: Props) {
  const { editable, handleRemove, values } = props;
  const { t } = useTranslation();

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
          <div key={date} className="flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <span className="normal-case">{dateLabel}</span>
            {editable && (
              <IconButton
                type="button"
                variant="ghost"
                size="xs"
                aria-label={
                  dateLabel ? `${t("aria_labels.common.remove")}: ${dateLabel}` : t("aria_labels.common.remove")
                }
                onClick={() => handleRemove(date)}
                icon={<CloseOutline height={10} width={10} />}
              />
            )}
          </div>
        );
      })}
    </>
  );
});
