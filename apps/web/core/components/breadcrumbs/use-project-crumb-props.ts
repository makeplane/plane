/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TCrumbLabelProps } from "@plane/blocks/breadcrumb";
// hooks
import { useProject } from "@/hooks/store/use-project";

/**
 * Ruling 39. The project crumb is rendered through `CommonProjectBreadcrumbs` / `ProjectBreadcrumb`,
 * whose element props are ids — so the collapsed overflow row below 640px had nothing to read and
 * came out blank and inert. The trail reads `crumbLabel` / `crumbHref` off the wrapper element
 * itself, which only the call site can set, and only a call site holding the project can name it.
 *
 * Spread the result onto the wrapper:
 *
 * ```tsx
 * const projectCrumb = useProjectCrumbProps(workspaceSlug, projectId);
 * <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug} projectId={projectId} {...projectCrumb} />
 * ```
 *
 * The href matches the crumb's own `handleOnClick` destination, so the collapsed row goes where
 * clicking the crumb goes.
 */
export function useProjectCrumbProps(
  workspaceSlug: string | undefined,
  projectId: string | undefined
): TCrumbLabelProps {
  // store hooks
  const { getPartialProjectById } = useProject();
  // derived values
  const project = projectId ? getPartialProjectById(projectId) : undefined;

  return {
    crumbLabel: project?.name,
    crumbHref: workspaceSlug && projectId ? `/${workspaceSlug}/projects/${projectId}/issues/` : undefined,
  };
}
