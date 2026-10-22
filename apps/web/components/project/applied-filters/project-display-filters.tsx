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
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
import type { TProjectAppliedDisplayFilterKeys } from "@plane/types";
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
          <div key={key} className="flex items-center gap-1 rounded-sm bg-layer-1 px-1.5 py-1 text-11">
            {displayLabel}
            {editable && (
              <IconButton
                type="button"
                variant="ghost"
                size="xs"
                aria-label={
                  displayLabel ? `${t("aria_labels.common.remove")}: ${displayLabel}` : t("aria_labels.common.remove")
                }
                onClick={() => handleRemove(key)}
                icon={<CloseOutline height={10} width={10} />}
              />
            )}
          </div>
        );
      })}
    </>
  );
});
