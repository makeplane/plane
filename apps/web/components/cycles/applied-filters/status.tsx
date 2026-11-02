/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { CYCLE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { RemovableChip } from "@/components/common/removable-chip";

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
        const statusDetails = CYCLE_STATUS.find((s) => s.value === status);
        const statusLabel = statusDetails ? t(statusDetails.i18n_title) : "";
        return (
          <RemovableChip
            key={status}
            variant="soft"
            label={statusLabel}
            ariaLabel={statusLabel}
            className={cn(statusDetails?.bgColor, statusDetails?.textColor)}
            onRemove={editable ? () => handleRemove(status) : undefined}
          />
        );
      })}
    </>
  );
});
