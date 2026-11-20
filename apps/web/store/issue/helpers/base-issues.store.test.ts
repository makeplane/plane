/**
 * Unit Test Suite: BaseIssuesStore.updateIssueList
 * Target: apps/web/store/issue/helpers/base-issues.store.ts
 * Verifies Issue #9049: Optimistic kanban drag/drop with parent_id and sub_issue=false
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseIssuesStore, EIssueGroupedAction } from "./base-issues.store";
import type { TIssue } from "@plane/types";
import type { IIssueRootStore } from "../root.store";
import type { IBaseIssueFilterStore } from "./issue-filter-helper.store";

// Mock store-context to prevent circular instantiation of RootStore -> ArchivedIssues -> BaseIssuesStore
vi.mock("@/lib/store-context", () => ({
  store: {
    issue: {
      issues: {
        issuesMap: {},
      },
    },
  },
  rootStore: {},
  StoreContext: {},
  StoreProvider: () => null,
}));

// Concrete subclass exposing BaseIssuesStore for unit testing
class TestIssuesStore extends BaseIssuesStore {
  fetchParentStats = vi.fn();
  updateParentStats = vi.fn();
}

describe("BaseIssuesStore - updateIssueList (Issue #9049)", () => {
  let store: TestIssuesStore;
  let mockIssuesMap: Record<string, TIssue>;
  let mockRootStore: IIssueRootStore;
  let mockIssueFilterStore: IBaseIssueFilterStore;

  const SOURCE_STATE = "state-backlog-001";
  const DEST_STATE = "state-in-progress-002";
  const EPIC_PARENT_ID = "epic-uuid-12345";
  const ISSUE_ID = "issue-uuid-99999";

  beforeEach(() => {
    mockIssuesMap = {};

    mockRootStore = {
      moduleId: undefined,
      cycleId: undefined,
      projectId: "project-001",
      rootStore: {
        router: {
          epicId: undefined,
        },
      },
      issues: {
        getIssuesByIds: (ids: string[]) => ids.map((id) => mockIssuesMap[id]).filter(Boolean),
        getIssueById: (id: string) => mockIssuesMap[id],
        addIssue: vi.fn(),
        updateIssue: vi.fn(),
      },
    } as unknown as IIssueRootStore;

    mockIssueFilterStore = {
      issueFilters: {
        displayFilters: {
          layout: "kanban",
          group_by: "state",
          sub_group_by: undefined,
          order_by: "-created_at",
          sub_issue: false, // Repro condition: 'Show sub-issues' toggled OFF
        },
      },
      filters: {},
    } as unknown as IBaseIssueFilterStore;

    store = new TestIssuesStore(mockRootStore, mockIssueFilterStore);
  });

  it("should move an issue with parent_id to the destination column when sub_issue is false (Drag & Drop Move)", () => {
    // Initial board state: issue is in the source column
    store.groupedIssueIds = {
      [SOURCE_STATE]: [ISSUE_ID],
      [DEST_STATE]: [],
    };

    const issueBeforeUpdate: TIssue = {
      id: ISSUE_ID,
      name: "Epic child work item",
      parent_id: EPIC_PARENT_ID,
      state_id: SOURCE_STATE,
      project_id: "project-001",
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    } as TIssue;

    const issueAfterUpdate: TIssue = {
      ...issueBeforeUpdate,
      state_id: DEST_STATE,
    };

    // Populate mock root store
    mockIssuesMap[EPIC_PARENT_ID] = {
      id: EPIC_PARENT_ID,
      name: "Parent Epic",
      is_epic: true,
      project_id: "project-001",
    } as TIssue;
    mockIssuesMap[ISSUE_ID] = issueAfterUpdate;

    // Execute optimistic update (as performed during Kanban card drop)
    store.updateIssueList(issueAfterUpdate, issueBeforeUpdate);

    // 1. Issue MUST be removed from source column
    expect(store.groupedIssueIds?.[SOURCE_STATE]).not.toContain(ISSUE_ID);

    // 2. Issue MUST be added to destination column
    expect(store.groupedIssueIds?.[DEST_STATE]).toContain(ISSUE_ID);
  });

  it("should still prevent unlisted newly created sub-issues from appearing as root cards when sub_issue is false", () => {
    store.groupedIssueIds = {
      [SOURCE_STATE]: [],
      [DEST_STATE]: [],
    };

    const newSubIssue: TIssue = {
      id: "brand-new-sub-task",
      name: "Newly created sub task",
      parent_id: "non-epic-parent-issue",
      state_id: SOURCE_STATE,
      project_id: "project-001",
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    } as TIssue;

    mockIssuesMap[newSubIssue.id] = newSubIssue;

    // When an issue is added afresh (no issueBeforeUpdate), it must respect sub_issue filter
    store.updateIssueList(newSubIssue, undefined, EIssueGroupedAction.ADD);

    expect(store.groupedIssueIds?.[SOURCE_STATE]).not.toContain(newSubIssue.id);
  });

  it("should successfully move root issues (parent_id is null) when sub_issue is false", () => {
    store.groupedIssueIds = {
      [SOURCE_STATE]: ["root-issue-001"],
      [DEST_STATE]: [],
    };

    const rootBefore: TIssue = {
      id: "root-issue-001",
      name: "Root issue",
      parent_id: null,
      state_id: SOURCE_STATE,
      project_id: "project-001",
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    } as TIssue;

    const rootAfter: TIssue = {
      ...rootBefore,
      state_id: DEST_STATE,
    };

    mockIssuesMap[rootAfter.id] = rootAfter;

    store.updateIssueList(rootAfter, rootBefore);

    expect(store.groupedIssueIds?.[SOURCE_STATE]).not.toContain("root-issue-001");
    expect(store.groupedIssueIds?.[DEST_STATE]).toContain("root-issue-001");
  });

  it("should allow newly created epic work item when parent is an epic", () => {
    store.groupedIssueIds = {
      [SOURCE_STATE]: [],
      [DEST_STATE]: [],
    };

    const epicParent: TIssue = {
      id: EPIC_PARENT_ID,
      name: "Parent Epic",
      is_epic: true,
      project_id: "project-001",
    } as TIssue;
    mockIssuesMap[EPIC_PARENT_ID] = epicParent;

    const newEpicWorkItem: TIssue = {
      id: "new-epic-work-item",
      name: "New Epic Work Item",
      parent_id: EPIC_PARENT_ID,
      state_id: SOURCE_STATE,
      project_id: "project-001",
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    } as TIssue;
    mockIssuesMap[newEpicWorkItem.id] = newEpicWorkItem;

    store.updateIssueList(newEpicWorkItem, undefined, EIssueGroupedAction.ADD);

    expect(store.groupedIssueIds?.[SOURCE_STATE]).toContain("new-epic-work-item");
  });

  it("should allow newly created work item when view is explicitly scoped to parent epic", () => {
    // Router epicId is scoped to EPIC_PARENT_ID
    (mockRootStore.rootStore.router as any).epicId = EPIC_PARENT_ID;

    store.groupedIssueIds = {
      [SOURCE_STATE]: [],
      [DEST_STATE]: [],
    };

    const newScopedItem: TIssue = {
      id: "new-scoped-item",
      name: "New Scoped Item",
      parent_id: EPIC_PARENT_ID,
      state_id: SOURCE_STATE,
      project_id: "project-001",
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    } as TIssue;
    mockIssuesMap[newScopedItem.id] = newScopedItem;

    store.updateIssueList(newScopedItem, undefined, EIssueGroupedAction.ADD);

    expect(store.groupedIssueIds?.[SOURCE_STATE]).toContain("new-scoped-item");
  });

  it("should NOT add existing sub-issue to board when its state is updated and sub_issue is false", () => {
    store.groupedIssueIds = {
      [SOURCE_STATE]: [],
      [DEST_STATE]: [],
    };

    const subIssueBefore: TIssue = {
      id: "existing-sub-task",
      name: "Existing sub task",
      parent_id: "regular-parent-task",
      state_id: SOURCE_STATE,
      project_id: "project-001",
    } as TIssue;

    const subIssueAfter: TIssue = {
      ...subIssueBefore,
      state_id: DEST_STATE,
    };

    mockIssuesMap[subIssueAfter.id] = subIssueAfter;

    store.updateIssueList(subIssueAfter, subIssueBefore);

    expect(store.groupedIssueIds?.[DEST_STATE]).not.toContain("existing-sub-task");
  });

  it("should move an issue with parent_id during drag and drop even if parent epic is not pre-loaded in store", () => {
    // Initial board state: issue is present in the source column
    store.groupedIssueIds = {
      [SOURCE_STATE]: [ISSUE_ID],
      [DEST_STATE]: [],
    };

    const issueBeforeUpdate: TIssue = {
      id: ISSUE_ID,
      name: "Epic child work item without preloaded parent",
      parent_id: "unloaded-parent-epic-id",
      state_id: SOURCE_STATE,
      project_id: "project-001",
    } as TIssue;

    const issueAfterUpdate: TIssue = {
      ...issueBeforeUpdate,
      state_id: DEST_STATE,
    };

    // Notice: mockIssuesMap does NOT have 'unloaded-parent-epic-id' loaded!
    mockIssuesMap[ISSUE_ID] = issueAfterUpdate;

    store.updateIssueList(issueAfterUpdate, issueBeforeUpdate);

    // Issue MUST still be removed from source and added to destination column
    expect(store.groupedIssueIds?.[SOURCE_STATE]).not.toContain(ISSUE_ID);
    expect(store.groupedIssueIds?.[DEST_STATE]).toContain(ISSUE_ID);
  });

  it("should NOT keep card on board when root issue is converted to a sub-issue and sub_issue is false", () => {
    // Initial board state: root issue is present on the board
    store.groupedIssueIds = {
      [SOURCE_STATE]: [ISSUE_ID],
      [DEST_STATE]: [],
    };

    const rootIssueBefore: TIssue = {
      id: ISSUE_ID,
      name: "Root issue converted to sub-issue",
      parent_id: undefined,
      state_id: SOURCE_STATE,
      project_id: "project-001",
    } as unknown as TIssue;

    // Issue becomes a child of a regular non-epic issue and changes state
    const subIssueAfter: TIssue = {
      ...rootIssueBefore,
      parent_id: "regular-parent-task",
      state_id: DEST_STATE,
    };

    mockIssuesMap[subIssueAfter.id] = subIssueAfter;

    store.updateIssueList(subIssueAfter, rootIssueBefore);

    // Card MUST be removed from source column and NOT added to destination column
    expect(store.groupedIssueIds?.[SOURCE_STATE]).not.toContain(ISSUE_ID);
    expect(store.groupedIssueIds?.[DEST_STATE]).not.toContain(ISSUE_ID);
  });
});
