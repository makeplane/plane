/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
// plane package imports
import { Select } from "@plane/blocks/select";
import { Logo } from "@plane/blocks/emoji-icon-picker";
import { ProjectsOutline } from "@makeplane/propel/icons";
import type { TLogoProps } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";

type ProjectOption = {
  id: string;
  name: string;
  /** `name identifier` — what the in-dropdown search matches, so a project is reachable by either. */
  query: string;
  logo_props?: TLogoProps;
};

type Props = {
  value: string[] | undefined;
  onChange: (val: string[] | null) => void;
  projectIds: string[] | undefined;
};

export const ProjectSelect = observer(function ProjectSelect(props: Props) {
  const { value, onChange, projectIds } = props;
  const { getProjectById } = useProject();

  // derived values
  // Ruling 46: a project that has not hydrated into the store yet still gets a row keyed by its
  // id — dropping it here would also drop it from `selected` below, and `Select` would then emit
  // the thinned id list back to `onChange` on the next pick.
  const options = useMemo<ProjectOption[]>(
    () =>
      (projectIds ?? []).map((projectId) => {
        const projectDetails = getProjectById(projectId);
        if (!projectDetails) return { id: projectId, name: projectId, query: projectId };
        return {
          id: projectId,
          name: projectDetails.name,
          query: `${projectDetails.name} ${projectDetails.identifier}`,
          logo_props: projectDetails.logo_props,
        };
      }),
    [projectIds, getProjectById]
  );
  const optionsById = useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);
  // Derived id-first off the stored value, so a selected project outside `projectIds` survives.
  const selected = useMemo(
    () => (value ?? []).map((id) => optionsById.get(id) ?? { id, name: id, query: id }),
    [optionsById, value]
  );

  return (
    <Select<ProjectOption>
      multiple
      getValues={() => options}
      value={selected}
      onChange={(val) => onChange(val)}
      getOptionValue={(option) => option.id}
      getOptionLabel={(option) => option.name}
      getOptionSearchText={(option) => option.query}
      getOptionIcon={(option) =>
        option.logo_props ? (
          <Logo logo={option.logo_props} size={16} />
        ) : (
          <ProjectsOutline className="size-4 shrink-0" />
        )
      }
    >
      <Select.Trigger<ProjectOption>
        variant="select-md"
        className="w-auto"
        prependIcon={<ProjectsOutline aria-hidden="true" />}
      >
        {(selectedOptions) => (
          <span className="truncate">
            {selectedOptions.length > 3
              ? `3+ projects`
              : selectedOptions.length > 0
                ? selectedOptions.map((option) => option.name).join(", ")
                : "All projects"}
          </span>
        )}
      </Select.Trigger>
    </Select>
  );
});
