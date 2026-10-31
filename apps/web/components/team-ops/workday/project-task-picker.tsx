/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { InputField } from "@makeplane/propel/components/input-field";
import { SelectField } from "@makeplane/propel/components/select-field";
import type { TIssueSearchResponse } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
import useDebounce from "@/hooks/use-debounce";
// services
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

export type TPickedTask = { id: string; name: string; key: string; projectId: string };

type Props = {
  workspaceSlug: string;
  value: TPickedTask | null;
  onChange: (value: TPickedTask | null) => void;
  disabled?: boolean;
};

/** Two steps: the project first, then a work item of that project. */
export const ProjectTaskPicker = observer(function ProjectTaskPicker(props: Props) {
  const { workspaceSlug, value, onChange, disabled } = props;
  // states
  const [projectId, setProjectId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // hooks
  const { joinedProjectIds, getPartialProjectById } = useProject();
  const debouncedQuery = useDebounce(query, 250);

  const { data, isLoading } = useSWR(projectId ? `TEAM_OPS_PROJECT_TASKS_${projectId}_${debouncedQuery}` : null, () =>
    workspaceService.searchEntity(workspaceSlug, {
      count: 8,
      project_id: projectId!,
      query_type: ["issue"],
      query: debouncedQuery,
    })
  );

  const projectOptions = joinedProjectIds.map((id) => ({ value: id, label: getPartialProjectById(id)?.name ?? id }));
  const results: TIssueSearchResponse[] = data?.issue ?? [];

  const choose = (issue: TIssueSearchResponse) => {
    onChange({
      id: issue.id,
      name: issue.name,
      key: `${issue.project__identifier}-${issue.sequence_id}`,
      projectId: projectId!,
    });
    setQuery("");
  };

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-subtle bg-layer-1 px-3 py-2.5">
        <span className="min-w-0 truncate text-body-sm-medium text-primary">
          <span className="text-tertiary">{value.key}</span> {value.name}
        </span>
        <button
          type="button"
          className="shrink-0 text-body-xs-medium text-accent-primary hover:underline"
          onClick={() => onChange(null)}
          disabled={disabled}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <SelectField
          size="lg"
          label="1. Project"
          options={projectOptions}
          value={projectId ?? undefined}
          onValueChange={(next) => setProjectId(next ?? null)}
          disabled={disabled}
        />
      </div>
      <div>
        <p className="mb-1 text-body-xs-medium text-secondary">2. Task</p>
        <InputField
          type="text"
          size="lg"
          orientation="vertical"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={projectId ? "Search the work items of this project" : "Choose a project first"}
          aria-label="Search work items"
          disabled={disabled || !projectId}
        />
        {projectId ? (
          <ul className="mt-1 max-h-56 overflow-y-auto rounded-md border border-subtle bg-surface-1 py-1">
            {results.length === 0 ? (
              <li className="px-3 py-2 text-13 text-tertiary">
                {isLoading ? "Searching..." : "No work items found in this project."}
              </li>
            ) : (
              results.map((issue) => (
                <li key={issue.id}>
                  <button
                    type="button"
                    className="w-full truncate px-3 py-2 text-left text-13 hover:bg-layer-1"
                    onClick={() => choose(issue)}
                  >
                    <span className="font-medium text-tertiary">
                      {issue.project__identifier}-{issue.sequence_id}
                    </span>{" "}
                    {issue.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
});
