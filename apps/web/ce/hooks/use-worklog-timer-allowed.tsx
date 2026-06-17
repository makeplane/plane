/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkspace } from "@/hooks/store/use-workspace";

// Whether a timer may be started on a work item, based on its state group and the
// workspace default (overridable per-project). Defaults to the "started" (In Progress) group.
export const useWorklogTimerAllowed = (
  projectId: string | null | undefined,
  stateId: string | null | undefined
): boolean => {
  const { currentWorkspace } = useWorkspace();
  const { getProjectById } = useProject();
  const { getStateById } = useProjectState();

  if (!stateId) return false;
  const group = getStateById(stateId)?.group;
  if (!group) return false;

  const project = projectId ? getProjectById(projectId) : undefined;
  const allowed = project?.worklog_timer_state_groups ?? currentWorkspace?.worklog_timer_state_groups ?? ["started"];
  return allowed.includes(group);
};
