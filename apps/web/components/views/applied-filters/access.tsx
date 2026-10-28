/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// icons
import { useTranslation } from "@plane/i18n";
// constants
// helpers
import type { EViewAccess } from "@plane/types";
import { VIEW_ACCESS_SPECIFIERS } from "@/helpers/views.helper";
import { RemovableChip } from "@/components/common/removable-chip";

type Props = {
  editable: boolean | undefined;
  handleRemove: (val: EViewAccess) => void;
  values: EViewAccess[];
};

export const AppliedAccessFilters = observer(function AppliedAccessFilters(props: Props) {
  const { editable, handleRemove, values } = props;
  const { t } = useTranslation();

  const getAccessLabel = (val: EViewAccess) => {
    const value = VIEW_ACCESS_SPECIFIERS.find((option) => option.key === val);
    return value?.i18n_label;
  };

  return (
    <>
      {values.map((access) => {
        const label = getAccessLabel(access);

        if (!label) return null;

        const accessLabel = t(label);

        return (
          <RemovableChip
            key={access}
            variant="soft"
            label={accessLabel}
            ariaLabel={accessLabel}
            onRemove={editable ? () => handleRemove(access) : undefined}
          />
        );
      })}
    </>
  );
});
