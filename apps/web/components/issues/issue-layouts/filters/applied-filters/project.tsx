/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Logo } from "@plane/blocks/emoji-icon-picker";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { RemovableChip } from "@/components/common/removable-chip";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedProjectFilters = observer(function AppliedProjectFilters(props: Props) {
  const { handleRemove, values, editable } = props;
  // store hooks
  const { projectMap } = useProject();

  return (
    <>
      {values.map((projectId) => {
        const projectDetails = projectMap?.[projectId] ?? null;

        if (!projectDetails) return null;

        return (
          <RemovableChip
            key={projectId}
            variant="soft"
            icon={<Logo logo={projectDetails.logo_props} size={12} />}
            label={projectDetails.name}
            ariaLabel={projectDetails.name}
            onRemove={editable ? () => handleRemove(projectId) : undefined}
          />
        );
      })}
    </>
  );
});
