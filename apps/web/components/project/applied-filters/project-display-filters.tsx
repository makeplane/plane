/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// icons
// types
import { PROJECT_DISPLAY_FILTER_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TProjectAppliedDisplayFilterKeys } from "@plane/types";
import { RemovableChip } from "@/components/common/removable-chip";
// constants

type Props = {
  handleRemove: (key: TProjectAppliedDisplayFilterKeys) => void;
  values: TProjectAppliedDisplayFilterKeys[];
  editable: boolean | undefined;
};

export const AppliedProjectDisplayFilters = observer(function AppliedProjectDisplayFilters(props: Props) {
  const { handleRemove, values, editable } = props;
  const { t } = useTranslation();

  return (
    <>
      {values.map((key) => {
        const filterLabel = PROJECT_DISPLAY_FILTER_OPTIONS.find((s) => s.key === key)?.i18n_label;
        const displayLabel = filterLabel ? t(filterLabel) : "";
        return (
          <RemovableChip
            key={key}
            variant="soft"
            label={displayLabel}
            ariaLabel={displayLabel}
            onRemove={editable ? () => handleRemove(key) : undefined}
          />
        );
      })}
    </>
  );
});
