import { API_BASE_URL } from "@plane/constants";
import type { TBaseIssue } from "@plane/types";
import { APIService } from "@/services/api.service";
import type { EnrichedIssue, ProjectLookup, StateLookup } from "@/plane-web/components/profile/work-items-table";

type WorkItemKind = "today" | "overdue";

// Raw backend response from /api/users/me/work-items/{kind}/
// Server returns nested `_workspace` / `_project` / `_state`; the table consumes flat
// `_workspaceSlug` / `_workspaceName`, so we remap at this boundary.
type RawWorkItem = TBaseIssue & {
  _workspace?: { slug: string; name: string };
  _project?: ProjectLookup;
  _state?: StateLookup;
};

const toEnriched = (it: RawWorkItem): EnrichedIssue => ({
  ...it,
  _workspaceSlug: it._workspace?.slug ?? "",
  _workspaceName: it._workspace?.name ?? "",
  _project: it._project,
  _state: it._state,
});

export class CEUserWorkItemsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(kind: WorkItemKind, params?: { workspace?: string }): Promise<EnrichedIssue[]> {
    return this.get(`/api/users/me/work-items/${kind}/`, { params })
      .then((r) => {
        const raw: RawWorkItem[] = Array.isArray(r?.data) ? r.data : [];
        return raw.map(toEnriched);
      })
      .catch((e) => {
        throw e?.response?.data;
      });
  }
}
