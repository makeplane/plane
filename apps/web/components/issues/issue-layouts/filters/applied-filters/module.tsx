/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// hooks
import { ModuleOutline } from "@makeplane/propel/icons";
import { useModule } from "@/hooks/store/use-module";
import { RemovableChip } from "@/components/common/removable-chip";
// ui

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedModuleFilters = observer(function AppliedModuleFilters(props: Props) {
  const { handleRemove, values, editable } = props;
  // store hooks
  const { getModuleById } = useModule();

  return (
    <>
      {values.map((moduleId) => {
        const moduleDetails = getModuleById(moduleId) ?? null;

        if (!moduleDetails) return null;

        return (
          <RemovableChip
            key={moduleId}
            variant="soft"
            icon={<ModuleOutline className="h-3 w-3 flex-shrink-0" />}
            label={moduleDetails.name}
            ariaLabel={moduleDetails.name}
            onRemove={editable ? () => handleRemove(moduleId) : undefined}
          />
        );
      })}
    </>
  );
});
