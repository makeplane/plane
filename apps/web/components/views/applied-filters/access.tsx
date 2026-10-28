/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// icons
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
// constants
// helpers
import type { EViewAccess } from "@plane/types";
import { VIEW_ACCESS_SPECIFIERS } from "@/helpers/views.helper";

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
          <div
            key={access}
            className="flex items-center gap-1 rounded-sm bg-layer-1 px-1.5 py-1 text-caption-sm-regular"
          >
            <span className="normal-case">{accessLabel}</span>
            {editable && (
              <IconButton
                type="button"
                variant="ghost"
                size="xs"
                aria-label={`${t("aria_labels.common.remove")}: ${accessLabel}`}
                onClick={() => handleRemove(access)}
                icon={<CloseOutline height={10} width={10} />}
              />
            )}
          </div>
        );
      })}
    </>
  );
});
