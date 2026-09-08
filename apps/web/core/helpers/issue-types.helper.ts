/**
 * Questimus fork change (migration-karol.md §7.6 / Phase 3): shared loader +
 * module cache for a project's issue types (fetched from the §7.6 endpoint).
 *
 * The modal needs the default type synchronously-ish (it falls back to an
 * async load), the type badge needs names by id, and both share one fetch per
 * project. SWR dedupes across rows; this cache backs the modal's
 * getIssueTypeIdOnProjectChange path.
 */

import { IssueService } from "@/services/issue/issue.service";

export type TIssueType = {
  id: string;
  name: string;
  description: string;
  is_epic: boolean;
  is_default: boolean;
  level: number;
};

const service = new IssueService();

const cache = new Map<string, TIssueType[]>();

export async function loadProjectIssueTypes(workspaceSlug: string, projectId: string): Promise<TIssueType[]> {
  const cached = cache.get(projectId);
  if (cached) return cached;
  try {
    const types = await service.getProjectIssueTypes(workspaceSlug, projectId);
    cache.set(projectId, types);
    return types;
  } catch {
    return [];
  }
}

export function getCachedDefaultIssueTypeId(projectId: string): string | null {
  const types = cache.get(projectId);
  if (!types?.length) return null;
  return (types.find((t) => t.is_default) ?? types[0]).id;
}
