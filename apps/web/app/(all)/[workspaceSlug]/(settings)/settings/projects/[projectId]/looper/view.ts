import type { TLooperProjectIntegration } from "@/components/issues/issue-detail/looper-collaboration/types";

export const looperIntegrationLabel = (integration: TLooperProjectIntegration | undefined) => {
  switch (integration?.state) {
    case "active":
      return { label: "已启用", variant: "success" as const };
    case "paused":
      return { label: "已暂停", variant: "warning" as const };
    case "read_only":
      return { label: "只读", variant: "neutral" as const };
    default:
      return { label: "未启用", variant: "neutral" as const };
  }
};

export const looperActivationErrorMessage = (error: unknown) => {
  const code = typeof error === "object" && error && "error" in error ? String(error.error) : "";
  const messages: Record<string, string> = {
    role_policy_required: "请先保存产品、设计和 QA 的角色负责人。",
    active_binding_required: "还没有成员连接本机 Looper，请先点击“连接我的 Looper”。",
    node_directory_unavailable: "暂时无法确认 Looper 在线状态，请稍后重试。",
    node_capability_attestation_incomplete: "已连接的 Looper 当前离线或版本过旧，请启动或升级后重试。",
    planner_and_worker_bindings_required: "当前 Looper 缺少 Planner/Worker 能力，请重新连接或升级。",
  };
  return messages[code] ?? "启用失败，请检查角色、连接状态和 Looper 版本后重试。";
};
