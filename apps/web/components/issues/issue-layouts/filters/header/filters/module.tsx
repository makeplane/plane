/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ModuleOutline } from "@makeplane/propel/icons";
// components
import { FilterSubmenu } from "@/components/common/filters/filter-submenu";
// hooks
import { useModule } from "@/hooks/store/use-module";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
};

export const FilterModule = observer(function FilterModule(props: Props) {
  const { appliedFilters, handleUpdate } = props;
  // router
  const { projectId } = useParams();
  // store hooks
  const { getModuleById, getProjectModuleIds } = useModule();
  // derived values
  const moduleIds = projectId ? getProjectModuleIds(projectId.toString()) : undefined;
  const options = (moduleIds ?? []).flatMap((moduleId) => {
    const moduleDetails = getModuleById(moduleId);
    if (!moduleDetails) return [];
    return [
      {
        value: moduleDetails.id,
        label: moduleDetails.name,
        icon: <ModuleOutline className="h-3 w-3 flex-shrink-0" />,
      },
    ];
  });

  return (
    <FilterSubmenu
      label="Module"
      options={options}
      appliedFilters={appliedFilters}
      onToggle={handleUpdate}
      searchable
    />
  );
});
