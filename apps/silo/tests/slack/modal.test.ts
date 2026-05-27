/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Spec for buildCreateWorkItemView — the Block Kit view shown when
 * a user runs `/lplane`.
 */

import { describe, expect, it } from "vitest";

import { CREATE_WORK_ITEM_CALLBACK, buildCreateWorkItemView } from "../../src/slack/modal";

const meta = {
  workspaceSlug: "wz",
  channelId: "C123",
  triggerUserId: "U456",
  installerUserId: "user-id-uuid",
};

const projects = [
  { id: "p1", name: "Backend", identifier: "BE" },
  { id: "p2", name: "Frontend", identifier: "FE" },
];

describe("buildCreateWorkItemView", () => {
  it("uses the canonical callback id (matches interactions handler)", () => {
    const view = buildCreateWorkItemView(projects, meta);
    expect(view.callback_id).toBe(CREATE_WORK_ITEM_CALLBACK);
  });

  it("encodes metadata as JSON in private_metadata", () => {
    const view = buildCreateWorkItemView(projects, meta);
    expect(JSON.parse(view.private_metadata as string)).toEqual(meta);
  });

  it("renders one option per project with REF — name label", () => {
    const view = buildCreateWorkItemView(projects, meta);
    const blocks = view.blocks as Array<Record<string, unknown>>;
    const projectBlock = blocks.find((b) => b.block_id === "project") as Record<string, unknown> | undefined;
    expect(projectBlock).toBeTruthy();
    const element = projectBlock!.element as Record<string, unknown>;
    const options = element.options as Array<{ text: { text: string }; value: string }>;
    expect(options).toHaveLength(2);
    expect(options[0].value).toBe("p1");
    expect(options[0].text.text).toBe("BE — Backend");
    expect(options[1].text.text).toBe("FE — Frontend");
  });

  it("clamps project label length to 75 chars (Slack hard limit)", () => {
    const longProjects = [{ id: "p", name: "x".repeat(200), identifier: "ZZ" }];
    const view = buildCreateWorkItemView(longProjects, meta);
    const blocks = view.blocks as Array<Record<string, unknown>>;
    const element = blocks[0].element as Record<string, unknown>;
    const options = element.options as Array<{ text: { text: string } }>;
    expect(options[0].text.text.length).toBeLessThanOrEqual(75);
  });

  it("caps the project picker at 100 options", () => {
    const many = Array.from({ length: 150 }, (_, i) => ({
      id: `p${i}`,
      name: `Project ${i}`,
      identifier: `P${i}`,
    }));
    const view = buildCreateWorkItemView(many, meta);
    const blocks = view.blocks as Array<Record<string, unknown>>;
    const element = blocks[0].element as Record<string, unknown>;
    const options = element.options as unknown[];
    expect(options.length).toBeLessThanOrEqual(100);
  });

  it("falls back to an explainer block + no submit button when no projects exist", () => {
    const view = buildCreateWorkItemView([], meta);
    expect(view.submit).toBeUndefined();
    const blocks = view.blocks as Array<Record<string, unknown>>;
    expect(blocks[0].block_id).toBe("no_projects");
  });

  it("pre-fills initial title text from the slash command, truncated at 250", () => {
    const longText = "x".repeat(500);
    const view = buildCreateWorkItemView(projects, meta, longText);
    const blocks = view.blocks as Array<Record<string, unknown>>;
    const titleBlock = blocks.find((b) => b.block_id === "title") as Record<string, unknown> | undefined;
    const titleEl = titleBlock!.element as Record<string, unknown>;
    expect(titleEl.initial_value).toBe(longText.slice(0, 250));
  });

  it("description is optional", () => {
    const view = buildCreateWorkItemView(projects, meta);
    const blocks = view.blocks as Array<Record<string, unknown>>;
    const descBlock = blocks.find((b) => b.block_id === "description") as Record<string, unknown> | undefined;
    expect(descBlock).toBeTruthy();
    expect(descBlock!.optional).toBe(true);
  });
});
