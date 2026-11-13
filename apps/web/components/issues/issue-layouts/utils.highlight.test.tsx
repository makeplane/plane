/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HIGHLIGHT_CLASS, highlightIssueOnDrop } from "./utils";

const ELEMENT_ID = "issue_issue-1_started_null";

const createElement = (id: string) => {
  const element = document.createElement("div");
  element.id = id;
  document.body.appendChild(element);
  return element;
};

describe("highlightIssueOnDrop", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is a no-op when the element id is undefined", () => {
    expect(() => highlightIssueOnDrop(undefined)).not.toThrow();
    expect(document.body.innerHTML).toBe("");
  });

  it("is a no-op when the element never shows up", () => {
    highlightIssueOnDrop(ELEMENT_ID);

    // Runs past the last retry without the element ever being mounted.
    vi.runAllTimers();

    expect(document.getElementById(ELEMENT_ID)).toBeNull();
    expect(document.body.innerHTML).toBe("");
  });

  it("highlights an element that is mounted only after a retry", () => {
    highlightIssueOnDrop(ELEMENT_ID);
    expect(document.getElementById(ELEMENT_ID)).toBeNull();

    // The destination column is virtually rendered, so the block can mount after the drop.
    vi.advanceTimersByTime(200);
    const element = createElement(ELEMENT_ID);
    vi.advanceTimersByTime(400);

    expect(element.classList.contains(HIGHLIGHT_CLASS)).toBe(true);
    // It must not keep retrying once the element has been found.
    expect(document.body.innerHTML).toBe(`<div id="${ELEMENT_ID}" class="${HIGHLIGHT_CLASS}"></div>`);
  });

  it("does not highlight the same element twice", () => {
    createElement(ELEMENT_ID);

    highlightIssueOnDrop(ELEMENT_ID);
    vi.advanceTimersByTime(200);

    expect(document.querySelectorAll(`.${HIGHLIGHT_CLASS}`)).toHaveLength(1);
  });
});
