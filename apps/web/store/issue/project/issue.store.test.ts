import { afterEach, describe, expect, it, vi } from "vitest";
import type { TIssuesResponse } from "@plane/types";
import { BaseIssuesStore } from "../helpers/base-issues.store";
import type { IIssueRootStore } from "../root.store";
import type { IProjectIssuesFilter } from "./filter.store";
import { ProjectIssues } from "./issue.store";

vi.mock("@/lib/store-context", () => ({ store: {} }));

afterEach(() => vi.restoreAllMocks());

function setup() {
  const root = {
    rootStore: { router: {} },
  } as unknown as IIssueRootStore;

  const filters = {
    getFilterParams: vi.fn(() => ({ state_group: "hello" })),
  } as unknown as IProjectIssuesFilter;

  const onFetch = vi.spyOn(BaseIssuesStore.prototype, "onfetchIssues").mockImplementation(() => {});

  const store = new ProjectIssues(root, filters);
  const request = vi.spyOn(store.issueService, "getIssues");

  return { store, request, filters, onFetch };
}

const options = { canGroup: true, perPageCount: 50 };

describe("project request recovery", () => {
  it("preserves options after failure and clears the error on retry", async () => {
    const { store, request, filters, onFetch } = setup();

    request.mockRejectedValueOnce({
      state_group: ["Select a valid state group."],
    });

    await store.fetchIssues("workspace", "project", "init-loader", options);

    expect(store.hasFetchError).toBe(true);
    expect(store.getIssueLoader()).toBeUndefined();
    expect(store.paginationOptions).toEqual(options);

    request.mockResolvedValueOnce({} as TIssuesResponse);

    await store.fetchIssuesWithExistingPagination("workspace", "project", "init-loader");

    expect(store.hasFetchError).toBe(false);
    expect(request).toHaveBeenCalledTimes(2);
    expect(filters.getFilterParams).toHaveBeenLastCalledWith(options, "project", undefined, undefined, undefined);
    expect(onFetch).toHaveBeenCalledOnce();
  });

  it("ignores an older rejection after a newer request succeeds", async () => {
    const { store, request, onFetch } = setup();
    let rejectOld!: (reason: unknown) => void;

    request.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectOld = reject;
        })
    );

    const oldRequest = store.fetchIssues("workspace", "project", "init-loader", options);

    request.mockResolvedValueOnce({} as TIssuesResponse);

    await store.fetchIssues("workspace", "project", "init-loader", options);

    rejectOld(new Error("cancelled"));
    await oldRequest;

    expect(store.hasFetchError).toBe(false);
    expect(onFetch).toHaveBeenCalledOnce();
  });
});
