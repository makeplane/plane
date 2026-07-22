import assert from "node:assert/strict";
import test from "node:test";
import { looperActivationErrorMessage, looperIntegrationLabel } from "./view";

test("shows the project integration state without implying an inactive project is ready", () => {
  assert.deepEqual(looperIntegrationLabel(undefined), { label: "未启用", variant: "neutral" });
  assert.deepEqual(looperIntegrationLabel({ state: "active" } as never), { label: "已启用", variant: "success" });
  assert.deepEqual(looperIntegrationLabel({ state: "paused" } as never), { label: "已暂停", variant: "warning" });
});

test("turns activation precondition codes into an actionable next step", () => {
  assert.match(looperActivationErrorMessage({ error: "role_policy_required" }), /保存.*角色/);
  assert.match(looperActivationErrorMessage({ error: "active_binding_required" }), /连接我的 Looper/);
  assert.match(looperActivationErrorMessage({ error: "node_capability_attestation_incomplete" }), /离线或版本过旧/);
  assert.match(looperActivationErrorMessage({ error: "unknown" }), /检查角色、连接状态和 Looper 版本/);
});
