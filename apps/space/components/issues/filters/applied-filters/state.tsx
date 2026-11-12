/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { EIconSize } from "@plane/constants";
import { StateGroupIcon } from "@plane/blocks/icons";
import { useTranslation } from "@plane/i18n";
import { CloseOutline } from "@makeplane/propel/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
// hooks
import { useStates } from "@/hooks/store/use-state";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedStateFilters = observer(function AppliedStateFilters(props: Props) {
  const { handleRemove, values } = props;
  const { t } = useTranslation();

  const { sortedStates: states } = useStates();

  return (
    <>
      {values.map((stateId) => {
        const stateDetails = states?.find((s) => s.id === stateId);

        if (!stateDetails) return null;

        return (
          <div key={stateId} className="flex items-center gap-1 rounded-sm bg-layer-3 p-1 text-caption-sm-regular">
            <StateGroupIcon color={stateDetails.color} stateGroup={stateDetails.group} size={EIconSize.SM} />
            {stateDetails.name}
            <IconButton
              variant="ghost"
              size="xs"
              aria-label={`${t("common.remove")} ${stateDetails.name}`}
              showTooltip={false}
              icon={<Icon icon={CloseOutline} />}
              onClick={() => handleRemove(stateId)}
            />
          </div>
        );
      })}
    </>
  );
});
