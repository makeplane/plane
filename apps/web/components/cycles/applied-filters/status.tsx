/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { CYCLE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
import { cn } from "@plane/utils";

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
          <div
            key={status}
            className={cn(
              "flex items-center gap-1 rounded-sm px-1.5 py-1 text-caption-sm-regular",
              statusDetails?.bgColor,
              statusDetails?.textColor
            )}
          >
            {statusLabel}
            {editable && (
              <IconButton
                type="button"
                variant="ghost"
                size="xs"
                aria-label={
                  statusLabel ? `${t("aria_labels.common.remove")}: ${statusLabel}` : t("aria_labels.common.remove")
                }
                onClick={() => handleRemove(status)}
                icon={<CloseOutline height={10} width={10} />}
              />
            )}
          </div>
        );
      })}
    </>
  );
});
