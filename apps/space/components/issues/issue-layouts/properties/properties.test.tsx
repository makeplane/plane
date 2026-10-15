/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IssueBlockLabels } from "./labels";
import { IssueBlockState } from "./state";
import { IssueBlockDate } from "./due-date";
import { IssueBlockModules } from "./modules";

const data = vi.hoisted(() => ({
  labels: [
    { id: "label-1", name: "Design", color: "#266df0" },
    { id: "label-2", name: "Community", color: "#0fc27b" },
    { id: "label-3", name: "Review", color: "#9162f9" },
  ],
  states: { started: { name: "In progress", group: "started" } },
  modules: [{ id: "module-1", name: "Community release" }],
}));

vi.mock("@/hooks/store/use-label", () => ({
  useLabel: () => ({ getLabelsByIds: (ids: string[]) => data.labels.filter((label) => ids.includes(label.id)) }),
}));
vi.mock("@/hooks/store/use-state", () => ({
  useStates: () => ({ getStateById: (id: keyof typeof data.states) => data.states[id] }),
}));
vi.mock("@/hooks/store/use-module", () => ({
  useModule: () => ({ getModulesByIds: (ids: string[]) => data.modules.filter((module) => ids.includes(module.id)) }),
}));

describe("Public work-item properties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps CE's individual-label and collapsed-count rules", () => {
    const view = render(<IssueBlockLabels labelIds={["label-1", "label-2"]} />);
    expect(screen.getByText("Design")).toBeTruthy();
    expect(screen.getByText("Community")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();

    view.rerender(<IssueBlockLabels labelIds={["label-1", "label-2", "label-3"]} />);
    expect(screen.getByText("3 Labels")).toBeTruthy();
    expect(screen.queryByText("Design")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("preserves the optional empty-label text", () => {
    const view = render(<IssueBlockLabels labelIds={[]} />);
    expect(screen.getByRole("img", { name: "Labels: None" })).toBeTruthy();
    expect(screen.queryByText("No Labels")).toBeNull();

    view.rerender(<IssueBlockLabels labelIds={[]} shouldShowLabel />);
    expect(screen.getByText("No Labels")).toBeTruthy();
  });

  it("renders only known published states without introducing a property editor", () => {
    const view = render(<IssueBlockState stateId="started" />);
    expect(screen.getByText("In progress")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();

    view.rerender(<IssueBlockState stateId="missing-state" />);
    expect(view.container.textContent).toBe("");
  });

  it("preserves missing-date and module display values", () => {
    render(
      <>
        <IssueBlockDate due_date={undefined} stateId={undefined} />
        <IssueBlockModules moduleIds={["module-1"]} />
      </>
    );
    expect(screen.getByText("No Date")).toBeTruthy();
    expect(screen.getByText("Community release")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});
