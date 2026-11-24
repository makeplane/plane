/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmptyStateCompact } from "../compact-empty-state";
import { EmptyStateDetailed } from "../detailed-empty-state";

const { loadError, renderError } = vi.hoisted(() => ({
  loadError: new Error("Illustration chunk request failed"),
  renderError: new Error("Illustration component render failed"),
}));

vi.mock("./horizontal-stack/page", () => {
  throw loadError;
});
vi.mock("./vertical-stack/page", () => {
  throw loadError;
});
vi.mock("./horizontal-stack/project", () => ({
  ProjectHorizontalStackIllustration: ({ className }: { className?: string }) => (
    <svg data-testid="resolved-illustration" className={className} />
  ),
}));
vi.mock("./illustration/search", () => ({ SearchIllustration: undefined }));
vi.mock("./horizontal-stack/workflow", () => ({
  WorkflowHorizontalStackIllustration: () => {
    throw renderError;
  },
}));
vi.mock("./vertical-stack/workflow", () => ({
  WorkflowVerticalStackIllustration: () => {
    throw renderError;
  },
}));

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  override render() {
    return this.state.failed ? <p role="alert">Consumer error boundary</p> : this.props.children;
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("empty-state decorative illustration loading", () => {
  for (const [name, EmptyState, exportName] of [
    ["compact", EmptyStateCompact, "PageHorizontalStackIllustration"],
    ["detailed", EmptyStateDetailed, "PageVerticalStackIllustration"],
  ] as const) {
    it(`keeps ${name} text and actions usable when its illustration chunk rejects`, async () => {
      const onClick = vi.fn();
      const diagnostic = vi.spyOn(console, "error").mockImplementation(() => undefined);
      render(
        <ErrorBoundary>
          <EmptyState
            assetKey="page"
            title="Document your project"
            description="Capture notes and organize information."
            actions={[{ label: "Create page", onClick }]}
          />
        </ErrorBoundary>
      );

      await waitFor(() =>
        expect(diagnostic).toHaveBeenCalledWith(
          `[EmptyState] Illustration "${exportName}" failed to load its chunk.`,
          expect.any(Error)
        )
      );
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByRole("heading", { name: "Document your project" })).toBeDefined();
      expect(screen.getByText("Capture notes and organize information.")).toBeDefined();
      const action = screen.getByRole("button", { name: "Create page" });
      const user = userEvent.setup();
      await user.click(action);
      expect(onClick).toHaveBeenCalledTimes(1);
      action.focus();
      await user.keyboard("{Enter}");
      expect(onClick).toHaveBeenCalledTimes(2);
    });
  }

  it("renders a successfully loaded illustration and preserves its class name", async () => {
    const diagnostic = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<EmptyStateCompact assetKey="project" assetClassName="asset-size" title="Ready to start" />);
    expect((await screen.findByTestId("resolved-illustration")).getAttribute("class")).toBe("asset-size");
    expect(screen.getByText("Ready to start")).toBeDefined();
    expect(diagnostic).not.toHaveBeenCalled();
  });

  it("keeps the existing missing-export diagnostic and both consumers' content", async () => {
    const diagnostic = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <EmptyStateCompact assetKey="search" title="Compact search" />
        <EmptyStateDetailed assetKey="search" title="Detailed search" />
      </ErrorBoundary>
    );
    await waitFor(() =>
      expect(diagnostic).toHaveBeenCalledWith(
        '[EmptyState] Illustration "SearchIllustration" failed to resolve from its chunk.'
      )
    );
    expect(screen.getByText("Compact search")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Detailed search" })).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  for (const [name, EmptyState] of [
    ["compact", EmptyStateCompact],
    ["detailed", EmptyStateDetailed],
  ] as const) {
    it(`lets a ${name} illustration render exception reach the consumer boundary`, async () => {
      const diagnostic = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const onError = vi.fn();
      render(
        <ErrorBoundary onError={onError}>
          <EmptyState assetKey="workflow" title="This render should fail" />
        </ErrorBoundary>
      );
      expect(await screen.findByRole("alert")).toBeDefined();
      expect(onError).toHaveBeenCalledWith(renderError);
      expect(screen.queryByText("This render should fail")).toBeNull();
      expect(diagnostic.mock.calls.some(([message]) => String(message).startsWith("[EmptyState]"))).toBe(false);
    });
  }
});
