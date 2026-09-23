/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Breadcrumbs } from "./breadcrumbs";
import { BreadcrumbNavigationSelect } from "./breadcrumb-navigation-select";
import { SelectTriggerChrome } from "../select/trigger-chrome";
import { getCollapsedCrumb } from "./helpers";
import type { TCrumbLabelProps } from "./helpers";

const TRAIL_LABEL = "Breadcrumb";
/** Past any viewport, so the trail is always in its collapsed form. Below 640px in the app. */
const ALWAYS_COLLAPSED = 99999;

/**
 * The shape Ruling 39 is about: a wrapper component that renders the crumb's markup itself, so the
 * element handed to `Breadcrumbs.Item` carries ids rather than the crumb's tree. `crumbLabel` is
 * spread in from `TCrumbLabelProps`, exactly as `apps/web`'s `ProjectBreadcrumbWithPreference`
 * threads it.
 */
type ProjectCrumbProps = { projectId: string; projectName: string } & TCrumbLabelProps;

function ProjectCrumb(props: ProjectCrumbProps) {
  const { projectName } = props;
  return (
    <a href={`#/projects/${props.projectId}`}>
      <Breadcrumbs.ItemWrapper label={projectName} type="link">
        <Breadcrumbs.Label>{projectName}</Breadcrumbs.Label>
      </Breadcrumbs.ItemWrapper>
    </a>
  );
}

/** A stand-in for any crumb part that declares its own name, for the helper's precedence tests. */
function NamedCrumb(props: TCrumbLabelProps & { label?: string; children?: ReactNode }) {
  return <span>{props.children}</span>;
}

/** A plain, non-wrapper crumb — the shape every call site already had working. */
function plainCrumb(label: string, isLast = false) {
  const crumb = (
    <Breadcrumbs.ItemWrapper label={label} type="link" isLast={isLast}>
      <Breadcrumbs.Label>{label}</Breadcrumbs.Label>
    </Breadcrumbs.ItemWrapper>
  );
  return isLast ? crumb : <a href={`#/${label.toLowerCase()}`}>{crumb}</a>;
}

async function openOverflow(user: ReturnType<typeof userEvent.setup>) {
  const trail = screen.getByRole("navigation", { name: TRAIL_LABEL });
  await user.click(within(trail).getByRole("button"));
  return await waitFor(() => screen.getByRole("menu"));
}

describe("Breadcrumbs collapsed overflow rows", () => {
  it("names a wrapper-rendered crumb from its `crumbLabel`", async () => {
    const user = userEvent.setup();
    render(
      <Breadcrumbs ariaLabel={TRAIL_LABEL} collapseBreakpoint={ALWAYS_COLLAPSED}>
        <Breadcrumbs.Item component={plainCrumb("Plane")} />
        <Breadcrumbs.Item component={<ProjectCrumb projectId="p-1" projectName="Web app" crumbLabel="Web app" />} />
        <Breadcrumbs.Item component={plainCrumb("Work items", true)} />
      </Breadcrumbs>
    );

    const menu = await openOverflow(user);
    const rows = within(menu).getAllByRole("menuitem");
    // Without the `crumbLabel` read, the wrapper's row is blank: the element's props are ids, and
    // its markup only exists once React has rendered it.
    expect(rows.map((row) => row.textContent)).toEqual(["Plane", "Web app"]);
  });

  it("falls back to a wrapper's `aria-label` when no `crumbLabel` is given", async () => {
    const user = userEvent.setup();
    render(
      <Breadcrumbs ariaLabel={TRAIL_LABEL} collapseBreakpoint={ALWAYS_COLLAPSED}>
        <Breadcrumbs.Item component={<ProjectCrumb projectId="p-1" projectName="Web app" aria-label="Web app" />} />
        <Breadcrumbs.Item component={plainCrumb("Work items", true)} />
      </Breadcrumbs>
    );

    const menu = await openOverflow(user);
    expect(within(menu).getByRole("menuitem").textContent).toBe("Web app");
  });

  it("reads `crumbLabel` off the `Breadcrumbs.Item` itself", async () => {
    const user = userEvent.setup();
    render(
      <Breadcrumbs ariaLabel={TRAIL_LABEL} collapseBreakpoint={ALWAYS_COLLAPSED}>
        <Breadcrumbs.Item crumbLabel="Web app" component={<ProjectCrumb projectId="p-1" projectName="Web app" />} />
        <Breadcrumbs.Item component={plainCrumb("Work items", true)} />
      </Breadcrumbs>
    );

    const menu = await openOverflow(user);
    expect(within(menu).getByRole("menuitem").textContent).toBe("Web app");
  });

  it("navigates a wrapper-rendered row from its `crumbHref`", async () => {
    const user = userEvent.setup();
    render(
      <Breadcrumbs ariaLabel={TRAIL_LABEL} collapseBreakpoint={ALWAYS_COLLAPSED}>
        <Breadcrumbs.Item
          component={
            <ProjectCrumb projectId="p-1" projectName="Web app" crumbLabel="Web app" crumbHref="#/projects/p-1" />
          }
        />
        <Breadcrumbs.Item component={plainCrumb("Work items", true)} />
      </Breadcrumbs>
    );

    const menu = await openOverflow(user);
    expect(within(menu).getByRole("menuitem").getAttribute("href")).toBe("#/projects/p-1");
  });

  it("runs a wrapper-rendered row's `crumbOnClick`", async () => {
    const user = userEvent.setup();
    const crumbOnClick = vi.fn();
    render(
      <Breadcrumbs ariaLabel={TRAIL_LABEL} collapseBreakpoint={ALWAYS_COLLAPSED}>
        <Breadcrumbs.Item
          component={
            <ProjectCrumb projectId="p-1" projectName="Web app" crumbLabel="Web app" crumbOnClick={crumbOnClick} />
          }
        />
        <Breadcrumbs.Item component={plainCrumb("Work items", true)} />
      </Breadcrumbs>
    );

    const menu = await openOverflow(user);
    await user.click(within(menu).getByRole("menuitem"));
    expect(crumbOnClick).toHaveBeenCalledTimes(1);
  });

  it("leaves a wrapper-rendered row inert when it declares no navigation", async () => {
    const user = userEvent.setup();
    render(
      <Breadcrumbs ariaLabel={TRAIL_LABEL} collapseBreakpoint={ALWAYS_COLLAPSED}>
        <Breadcrumbs.Item component={<ProjectCrumb projectId="p-1" projectName="Web app" crumbLabel="Web app" />} />
        <Breadcrumbs.Item component={plainCrumb("Work items", true)} />
      </Breadcrumbs>
    );

    const menu = await openOverflow(user);
    const row = within(menu).getByRole("menuitem");
    // The wrapper's own `<a>` is inside its markup, which the trail cannot read — so a `crumbLabel`
    // with no `crumbHref` names the row and stops there. This is why every migrating wrapper has to
    // declare both.
    expect(row.textContent).toBe("Web app");
    expect(row.getAttribute("href")).toBeNull();
    expect(row.getAttribute("data-disabled")).not.toBeNull();
  });

  it("leaves a crumb that names itself through its markup alone", async () => {
    const user = userEvent.setup();
    render(
      <Breadcrumbs ariaLabel={TRAIL_LABEL} collapseBreakpoint={ALWAYS_COLLAPSED}>
        <Breadcrumbs.Item component={plainCrumb("Plane")} />
        <Breadcrumbs.Item component={plainCrumb("Work items", true)} />
      </Breadcrumbs>
    );

    const menu = await openOverflow(user);
    expect(within(menu).getByRole("menuitem").textContent).toBe("Plane");
  });
});

describe("getCollapsedCrumb", () => {
  it("prefers `crumbLabel` over `label`, `aria-label` and the rendered text", () => {
    const node = (
      <NamedCrumb label="From label" crumbLabel="From crumbLabel" aria-label="From aria-label">
        From text
      </NamedCrumb>
    );
    expect(getCollapsedCrumb(node).label).toBe("From crumbLabel");
  });

  it("prefers `label` over `aria-label`", () => {
    const node = (
      <NamedCrumb label="From label" aria-label="From aria-label">
        From text
      </NamedCrumb>
    );
    expect(getCollapsedCrumb(node).label).toBe("From label");
  });

  it("ignores an empty `crumbLabel` and keeps walking", () => {
    const node = <ProjectCrumb projectId="p-1" projectName="Web app" crumbLabel="" aria-label="Web app" />;
    expect(getCollapsedCrumb(node).label).toBe("Web app");
  });

  it("still honours the caller's explicit overrides", () => {
    const onClick = vi.fn();
    const node = <ProjectCrumb projectId="p-1" projectName="Web app" crumbLabel="Web app" />;
    expect(getCollapsedCrumb(node, { label: "Override", onClick })).toMatchObject({ label: "Override", onClick });
  });

  it("prefers a wrapper's `crumbHref` over an `href` deeper in the tree", () => {
    const node = (
      <NamedCrumb crumbLabel="Web app" crumbHref="#/projects/p-1">
        <a href="#/inner">Web app</a>
      </NamedCrumb>
    );
    expect(getCollapsedCrumb(node).href).toBe("#/projects/p-1");
  });
});

describe("Breadcrumbs static ancestors", () => {
  it("keeps text ancestors non-navigating without current-page semantics", () => {
    render(
      <Breadcrumbs ariaLabel={TRAIL_LABEL}>
        <Breadcrumbs.Item component={<Breadcrumbs.ItemWrapper type="text">Workspace</Breadcrumbs.ItemWrapper>} />
        <Breadcrumbs.Item component={plainCrumb("Work items", true)} />
      </Breadcrumbs>
    );
    const ancestor = screen.getByText("Workspace");
    expect(ancestor.getAttribute("aria-current")).toBeNull();
    expect(ancestor.tagName).toBe("SPAN");
    expect(ancestor.hasAttribute("href")).toBe(false);
    expect(ancestor.hasAttribute("tabindex")).toBe(false);
    expect(screen.getByText("Work items").closest('[aria-current="page"]')).not.toBeNull();
  });
});

describe("Breadcrumb current-item state", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"], shouldAdvanceTime: true });
  });

  afterEach(async () => {
    // The dropdown's virtualizer schedules scroll-reset callbacks that can outlive unmount.
    // Run them while jsdom still exists, as in the navigation-select tests.
    cleanup();
    try {
      await act(() => vi.runOnlyPendingTimersAsync());
    } finally {
      vi.useRealTimers();
    }
  });

  it("follows the last item through app wrappers and updates when a descendant is added", () => {
    const project = <ProjectCrumb projectId="p-1" projectName="Project" />;
    const { container, rerender } = render(
      <Breadcrumbs>
        <Breadcrumbs.Item component={project} />
      </Breadcrumbs>
    );
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe("Project");
    rerender(
      <Breadcrumbs>
        <Breadcrumbs.Item component={project} />
        <Breadcrumbs.Item component={<Breadcrumbs.ItemWrapper>Pages</Breadcrumbs.ItemWrapper>} />
      </Breadcrumbs>
    );
    expect([...container.querySelectorAll('[aria-current="page"]')].map((node) => node.textContent)).toEqual(["Pages"]);
  });

  it("marks a combined dropdown current without marking an ancestor", () => {
    const { container } = render(
      <Breadcrumbs>
        <Breadcrumbs.Item component={<Breadcrumbs.ItemWrapper>Workflows</Breadcrumbs.ItemWrapper>} />
        <Breadcrumbs.Item component={<SelectTriggerChrome variant="breadcrumb" label="Default Workflow" />} />
      </Breadcrumbs>
    );
    const current = container.querySelector('[aria-current="page"]');
    expect(current?.tagName).toBe("BUTTON");
    expect(current?.textContent).toBe("Default Workflow");
    expect(container.querySelectorAll('[aria-current="page"]').length).toBe(1);
  });

  it("opens the current breadcrumb label as a single dropdown control", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onNavigate = vi.fn();
    const { container } = render(
      <Breadcrumbs>
        <Breadcrumbs.Item
          component={
            <BreadcrumbNavigationSelect
              selectedItemKey="one"
              navigationItems={[{ key: "one", label: "Current page" }]}
              handleOnClick={onNavigate}
              placeholder="Page"
            />
          }
        />
      </Breadcrumbs>
    );
    const current = container.querySelector('[aria-current="page"]') as HTMLButtonElement;
    expect(current.textContent).toBe("Current page");
    await user.click(current);
    expect(await screen.findByRole("option", { name: "Current page" })).toBeDefined();
    expect(onNavigate).not.toHaveBeenCalled();
    expect(within(container).getByRole("combobox", { name: "Page, Current page" }).hasAttribute("disabled")).toBe(
      false
    );
  });
});

describe("Ancestor-only breadcrumb trails", () => {
  it("allows an explicit ancestor to opt out of inherited current state", () => {
    const { container } = render(
      <Breadcrumbs>
        <Breadcrumbs.Item
          component={
            <Breadcrumbs.ItemWrapper label="Settings" isLast={false}>
              Settings
            </Breadcrumbs.ItemWrapper>
          }
        />
      </Breadcrumbs>
    );
    expect(container.querySelector('[aria-current="page"]')).toBeNull();
  });
});
