import assert from "node:assert/strict";
import { describe, it } from "node:test";

const viewModule = (await import(
  new URL("./delivery-overview-view.ts", import.meta.url).href
)) as typeof import("./delivery-overview-view");
const { findPrimaryArtifact, formatElapsedDuration, resolveDeliveryOverview, resolveRecentEvent } = viewModule;

const summary = (overrides = {}) =>
  ({
    visibility: "visible",
    protocol: "strict_v1",
    read_only: false,
    permissions: { can_view: true, can_dispatch: false, can_stop: true, can_release: false },
    dispatch: {
      id: "dispatch-1",
      revision: 2,
      state_version: 4,
      role_policy_revision: 1,
      state: "running",
      health: "ok",
      requested_mode: "auto",
      active_role: "worker",
      owner: null,
      node: { id: "node-1", name: "MacBook", live_status: "online", last_ack_at: null },
      created_at: "2026-07-22T08:00:00Z",
      updated_at: "2026-07-22T08:30:00Z",
    },
    current_phase: "implementation",
    ...overrides,
  }) as any;

describe("formatElapsedDuration", () => {
  it("formats minute, hour, and day durations in Chinese", () => {
    const start = "2026-07-22T08:00:00Z";
    assert.equal(formatElapsedDuration(start, Date.parse("2026-07-22T08:00:30Z"), "zh-CN"), "不到 1 分钟");
    assert.equal(formatElapsedDuration(start, Date.parse("2026-07-22T10:05:00Z"), "zh-CN"), "2 小时 5 分钟");
    assert.equal(formatElapsedDuration(start, Date.parse("2026-07-23T11:00:00Z"), "zh-CN"), "1 天 3 小时");
  });
});

describe("resolveDeliveryOverview", () => {
  it("prioritizes an unhealthy dispatch over its phase", () => {
    const result = resolveDeliveryOverview(
      summary({ dispatch: { ...summary().dispatch, health: "node_unreachable" } })
    );
    assert.equal(result.tone, "warning");
    assert.equal(result.blockerKey, "issue.looper.health.node_unreachable");
  });

  it("shows a human decision as the active blocker", () => {
    const result = resolveDeliveryOverview(summary({ waiting_role: "product", current_question: "Choose a scope" }));
    assert.equal(result.titleKey, "issue.looper.overview.title.waiting_human");
    assert.equal(result.blockerKey, "issue.looper.blocker.human_decision");
  });

  it("recognizes implementation, pull request, QA, and completion", () => {
    assert.equal(resolveDeliveryOverview(summary()).primaryArtifactType, "technical_spec");
    assert.equal(
      resolveDeliveryOverview(summary({ current_phase: "pull_request" })).primaryArtifactType,
      "pull_request"
    );
    assert.equal(resolveDeliveryOverview(summary({ current_phase: "qa" })).primaryArtifactType, "qa");
    assert.equal(
      resolveDeliveryOverview(
        summary({ current_phase: "complete", dispatch: { ...summary().dispatch, state: "completed" } })
      ).tone,
      "success"
    );
  });
});

describe("resolveRecentEvent", () => {
  it("maps known events and hides raw unknown event names", () => {
    const baseEvent = {
      id: "event-1",
      version: 1,
      phase: "implementation",
      role: null,
      actor: null,
      occurred_at: "2026-07-22T08:00:00Z",
    } as const;
    assert.equal(
      resolveRecentEvent({ ...baseEvent, type: "technical_spec_approved" }),
      "issue.looper.activity.event.technical_spec_approved"
    );
    assert.equal(
      resolveRecentEvent({ ...baseEvent, type: "something_private" }),
      "issue.looper.activity.event.generic"
    );
  });
});

describe("findPrimaryArtifact", () => {
  it("finds the artifact relevant to the current delivery phase", () => {
    const input = summary({
      artifacts: [
        { id: "1", type: "technical_spec", title: "技术方案", url: "/spec", source_revision_id: "1" },
        { id: "2", type: "pull_request", title: "PR #42", url: "/pr", source_revision_id: "2" },
      ],
    });
    assert.equal(findPrimaryArtifact(input, "pull_request")?.id, "2");
  });
});
