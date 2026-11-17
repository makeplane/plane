/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// ui
import { MODULE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ModuleStatusIcon } from "@plane/blocks/icons";
import { RemovableChip } from "@/components/common/removable-chip";
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
          <RemovableChip
            key={status}
            variant="soft"
            icon={<ModuleStatusIcon status={statusDetails.value} height="12px" width="12px" />}
            label={t(statusDetails.i18n_label)}
            ariaLabel={t(statusDetails.i18n_label)}
            onRemove={editable ? () => handleRemove(status) : undefined}
          />
        );
      })}
    </>
  );
});
