/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CycleSelect } from "./cycle-select";
import { EstimateSelect } from "./estimate-select";
import { IntakeStateSelect } from "./intake-state-select";
import { LabelSelect } from "./label-select/label-select";
import { MemberSelect } from "./member-select";
import { ModuleSelect } from "./module-select";
import { PrioritySelect } from "./priority-select";
import { ProjectSelect } from "./project-select";
import { StateSelect } from "./state-select";

// CE addition: every property select takes an optional `tabIndex` and puts it on its trigger, so
// forms that order their controls explicitly (the work item create modal) keep that order.

/** Real callers pass a computed index (`getTabIndex(...).getIndex("state_id")`), never a literal. */
const FORM_TAB_INDEX = 4;

const emptyPage = () => Promise.resolve({ results: [], next_page_results: false });

type TCase = [name: string, renderSelect: (tabIndex?: number) => ReactElement];

const cases: TCase[] = [
  [
    "CycleSelect",
    (tabIndex) => (
      <CycleSelect getValues={emptyPage} value={null} onChange={vi.fn()} variant="pill-sm" tabIndex={tabIndex} />
    ),
  ],
  [
    "EstimateSelect",
    (tabIndex) => (
      <EstimateSelect getValues={emptyPage} value={null} onChange={vi.fn()} variant="pill-sm" tabIndex={tabIndex} />
    ),
  ],
  [
    "IntakeStateSelect",
    (tabIndex) => (
      <IntakeStateSelect getValues={emptyPage} value={null} onChange={vi.fn()} variant="pill-sm" tabIndex={tabIndex} />
    ),
  ],
  [
    "LabelSelect",
    (tabIndex) => (
      <LabelSelect getValues={emptyPage} value={[]} onChange={vi.fn()} variant="pill-sm" tabIndex={tabIndex} />
    ),
  ],
  [
    "MemberSelect (single)",
    (tabIndex) => (
      <MemberSelect getValues={emptyPage} value={null} onChange={vi.fn()} variant="pill-sm" tabIndex={tabIndex} />
    ),
  ],
  [
    "MemberSelect (multiple)",
    (tabIndex) => (
      <MemberSelect
        multiple
        getValues={emptyPage}
        value={[]}
        onChange={vi.fn()}
        variant="pill-sm"
        tabIndex={tabIndex}
      />
    ),
  ],
  [
    "ModuleSelect (single)",
    (tabIndex) => (
      <ModuleSelect getValues={emptyPage} value={null} onChange={vi.fn()} variant="pill-sm" tabIndex={tabIndex} />
    ),
  ],
  [
    "ModuleSelect (multiple)",
    (tabIndex) => (
      <ModuleSelect
        multiple
        getValues={emptyPage}
        value={[]}
        onChange={vi.fn()}
        variant="pill-sm"
        tabIndex={tabIndex}
      />
    ),
  ],
  [
    "PrioritySelect",
    (tabIndex) => <PrioritySelect value="none" onChange={vi.fn()} variant="pill-sm" tabIndex={tabIndex} />,
  ],
  [
    "ProjectSelect (single)",
    (tabIndex) => (
      <ProjectSelect getValues={emptyPage} value={null} onChange={vi.fn()} variant="pill-sm" tabIndex={tabIndex} />
    ),
  ],
  [
    "ProjectSelect (multiple)",
    (tabIndex) => (
      <ProjectSelect
        multiple
        getValues={emptyPage}
        value={[]}
        onChange={vi.fn()}
        variant="pill-sm"
        tabIndex={tabIndex}
      />
    ),
  ],
  [
    "StateSelect",
    (tabIndex) => (
      <StateSelect getValues={emptyPage} value={null} onChange={vi.fn()} variant="pill-sm" tabIndex={tabIndex} />
    ),
  ],
];

describe("property select tabIndex", () => {
  it.each(cases)("%s puts the caller's tab index on the trigger", (_name, renderSelect) => {
    render(renderSelect(FORM_TAB_INDEX));
    expect(screen.getByRole("button").getAttribute("tabindex")).toBe(String(FORM_TAB_INDEX));
  });

  it.each(cases)("%s leaves the natural tab order alone when no index is given", (_name, renderSelect) => {
    render(renderSelect());
    expect(screen.getByRole("button").hasAttribute("tabindex")).toBe(false);
  });
});
