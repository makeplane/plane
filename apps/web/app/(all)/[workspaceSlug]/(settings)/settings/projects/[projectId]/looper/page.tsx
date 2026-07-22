/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Check, Laptop, Lock, TriangleAlert } from "lucide-react";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { Badge } from "@plane/propel/badge";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ConnectLooperModal } from "@/components/issues/issue-detail/looper-collaboration/connect-looper-modal";
import type { TLooperRole, TLooperRolePolicy } from "@/components/issues/issue-detail/looper-collaboration/types";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { LooperCollaborationService } from "@/services/issue";
import type { Route } from "./+types/page";
import { LooperProjectSettingsHeader } from "./header";
import { looperActivationErrorMessage, looperIntegrationLabel } from "./view";

const looperService = new LooperCollaborationService();
const ACTIVATION_CHECKLIST_REVISION = 1;

type RoleDraft = Pick<TLooperRolePolicy, "product_member_id" | "design_member_id" | "qa_member_id">;

const EMPTY_DRAFT: RoleDraft = { product_member_id: "", design_member_id: "", qa_member_id: "" };

/** The accents the work item panel already uses, so a role reads the same on both surfaces. */
const ROLE_ACCENT: Record<TLooperRole, string> = {
  product: "bg-accent-primary",
  design: "bg-warning-primary",
  engineering: "bg-success-primary",
  qa: "bg-layer-3",
};

/** Listed in the order Looper walks them; engineering carries no field because Looper owns that seat. */
const ROLE_ROWS: { role: TLooperRole; field: keyof RoleDraft | null; label: string; description: string }[] = [
  {
    role: "product",
    field: "product_member_id",
    label: "产品决策",
    description: "范围、优先级、验收目标；大需求可要求正式产品 Spec。",
  },
  {
    role: "design",
    field: "design_member_id",
    label: "设计决策",
    description: "界面与交互方案；Looper 可附示意 HTML 和截图供选择。",
  },
  {
    role: "engineering",
    field: null,
    label: "研发决策",
    description: "始终由该任务的 Looper owner 决策，随派发对象自动变化。",
  },
  {
    role: "qa",
    field: "qa_member_id",
    label: "QA 验收",
    description: "验收计划、验证结论和回归结果。",
  },
];

/** One numbered step of the setup; the marker is the only progress signal, the copy carries the rest. */
function SetupStep(props: { children: ReactNode; description: string; index: number; isDone: boolean; title: string }) {
  const { children, description, index, isDone, title } = props;

  return (
    <section className="overflow-hidden rounded-lg border border-subtle bg-surface-1">
      <div className="flex items-start gap-3 px-4 py-4">
        <span
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-subtle-1 bg-layer-1 text-caption-sm-medium text-tertiary",
            isDone && "border-success-strong bg-success-primary text-on-color"
          )}
          aria-hidden="true"
        >
          {isDone ? <Check className="size-3" strokeWidth={3} /> : index}
        </span>
        <div className="min-w-0">
          <h3 className="text-body-sm-medium text-primary">{title}</h3>
          <p className="mt-1 max-w-3xl text-caption-md-regular text-tertiary">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function LooperSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  const { currentProjectDetails } = useProject();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);
  const [draft, setDraft] = useState<RoleDraft>(EMPTY_DRAFT);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug && projectId ? `looper-settings:${workspaceSlug}:${projectId}` : null,
    async () => {
      const [policy, integration] = await Promise.all([
        looperService.getRolePolicy(workspaceSlug, projectId),
        looperService.getProjectIntegration(workspaceSlug, projectId),
      ]);
      return { policy, integration };
    }
  );

  useEffect(() => {
    if (!data?.policy) return;
    setDraft({
      product_member_id: data.policy.product_member_id,
      design_member_id: data.policy.design_member_id,
      qa_member_id: data.policy.qa_member_id,
    });
  }, [data?.policy]);

  const isComplete = Boolean(draft.product_member_id && draft.design_member_id && draft.qa_member_id);
  const hasChanges = useMemo(
    () =>
      draft.product_member_id !== (data?.policy?.product_member_id ?? "") ||
      draft.design_member_id !== (data?.policy?.design_member_id ?? "") ||
      draft.qa_member_id !== (data?.policy?.qa_member_id ?? ""),
    [data?.policy, draft]
  );
  const status = looperIntegrationLabel(data?.integration);
  const isRolePolicySaved = Boolean(data?.policy) && !hasChanges;
  const isIntegrationActive = data?.integration.state === "active";
  const pausedReason = data?.integration.state === "paused" ? data.integration.paused_reason : "";
  const rolesHint = !isComplete
    ? "还需选择产品、设计和 QA 负责人。"
    : hasChanges
      ? "有未保存的修改。"
      : "角色已保存，Looper 会按这些负责人分流决策问题。";

  const saveRoles = async () => {
    if (!isComplete) return;
    setIsSaving(true);
    try {
      await looperService.updateRolePolicy(workspaceSlug, projectId, draft);
      await mutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: "角色已保存", message: "Looper 会按这些负责人分流决策问题。" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "保存失败", message: "请确认所选成员仍在当前项目中。" });
    } finally {
      setIsSaving(false);
    }
  };

  const activate = async () => {
    setIsActivating(true);
    try {
      await looperService.activateProjectIntegration(workspaceSlug, projectId, ACTIVATION_CHECKLIST_REVISION);
      await mutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Looper 已启用", message: "项目现在可以安全派发任务。" });
    } catch (activateError) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "暂时无法启用",
        message: looperActivationErrorMessage(activateError),
      });
    } finally {
      setIsActivating(false);
    }
  };

  if (workspaceUserInfo && !isAdmin) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<LooperProjectSettingsHeader />} hugging>
      <PageHead title={currentProjectDetails?.name ? `${currentProjectDetails.name} - Looper` : "Looper"} />
      <SettingsHeading
        title="Looper 协作"
        description="配置任务在产品、设计、研发和 QA 之间如何流转，并连接负责执行的本机 Looper。"
        control={<Badge variant={status.variant}>{status.label}</Badge>}
      />

      {isLoading ? (
        <Loader className="mt-6 flex flex-col gap-4">
          <Loader.Item height="292px" className="rounded-lg" />
          <Loader.Item height="148px" className="rounded-lg" />
          <Loader.Item height="148px" className="rounded-lg" />
        </Loader>
      ) : error ? (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-subtle bg-surface-1 px-4 py-4">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger-primary" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="text-body-sm-medium text-primary">无法读取 Looper 项目设置</h3>
            <p className="mt-1 text-caption-md-regular text-tertiary">请刷新后重试。</p>
            <Button className="mt-3" variant="secondary" size="lg" onClick={() => void mutate()}>
              重试
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <SetupStep
            index={1}
            isDone={isRolePolicySaved}
            title="选择角色负责人"
            description="Looper 只在确实有问题时发起对话；问题只发给对应角色，回答不足会继续追问，收敛后自动恢复研发流程。"
          >
            <div className="divide-y divide-subtle border-t border-subtle">
              {ROLE_ROWS.map((row) => {
                const field = row.field;
                return (
                  <div
                    key={row.role}
                    className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-8"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={cn("mt-1 h-7 w-0.5 shrink-0 rounded-full", ROLE_ACCENT[row.role])}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-body-sm-medium text-primary">{row.label}</span>
                          {!field && <Badge size="sm">自动</Badge>}
                        </div>
                        <p className="mt-0.5 text-caption-md-regular text-tertiary">{row.description}</p>
                      </div>
                    </div>
                    {field ? (
                      <div className="h-7 w-full shrink-0 md:w-64">
                        <MemberDropdown
                          projectId={projectId}
                          value={draft[field] || null}
                          onChange={(value) => setDraft((current) => ({ ...current, [field]: value ?? "" }))}
                          multiple={false}
                          disabled={!isAdmin}
                          showUserDetails
                          dropdownArrow
                          buttonVariant="border-with-text"
                          buttonContainerClassName="w-full"
                          placeholder="选择项目成员"
                        />
                      </div>
                    ) : (
                      <div className="flex h-7 w-full shrink-0 items-center gap-1.5 rounded-md border border-subtle bg-layer-1 px-2 md:w-64">
                        <Lock className="size-3.5 shrink-0 text-tertiary" aria-hidden="true" />
                        <span className="truncate text-body-xs-medium text-secondary">跟随该任务的 Looper owner</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col items-start gap-3 border-t border-subtle px-4 py-3 md:flex-row md:items-center md:justify-end">
              <p className="text-caption-md-regular text-tertiary md:mr-auto">{rolesHint}</p>
              <Button
                variant="primary"
                size="lg"
                disabled={!isComplete || !hasChanges}
                loading={isSaving}
                onClick={() => void saveRoles()}
              >
                保存角色
              </Button>
            </div>
          </SetupStep>

          <SetupStep
            index={2}
            isDone={false}
            title="研发连接本机 Looper"
            description="每位研发只连接自己的一台电脑。私钥始终留在本机；Plane 只向任务负责人自己的 Looper 派发。"
          >
            <div className="border-t border-subtle px-4 py-3">
              <Button variant="secondary" size="lg" onClick={() => setIsConnectOpen(true)}>
                <Laptop className="size-4" aria-hidden="true" />
                连接我的 Looper
              </Button>
              <p className="mt-3 text-caption-md-regular text-tertiary">
                连接成功后可运行
                <code className="font-mono mx-1 rounded bg-layer-1 px-1.5 py-0.5 text-caption-sm-regular text-secondary">
                  looper plane doctor
                </code>
                做完整自检。
              </p>
            </div>
          </SetupStep>

          <SetupStep
            index={3}
            isDone={Boolean(isIntegrationActive)}
            title="启用项目协作"
            description="启用后项目才能安全派发任务。Plane 会先检查角色策略和已连接的 Looper，条件不满足时会说明原因。"
          >
            <div className="flex flex-col items-start gap-2 border-t border-subtle px-4 py-3">
              {isIntegrationActive ? (
                <p className="flex items-center gap-1.5 text-caption-md-regular text-secondary">
                  <Check className="size-3.5 shrink-0 text-success-primary" aria-hidden="true" />
                  项目协作已启用，任务可以派发给成员自己的 Looper。
                </p>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={!data?.policy}
                    loading={isActivating}
                    onClick={() => void activate()}
                  >
                    启用项目协作
                  </Button>
                  {!data?.policy && (
                    <p className="text-caption-md-regular text-tertiary">请先完成第 1 步并保存角色。</p>
                  )}
                </>
              )}
              {pausedReason && <p className="text-caption-md-regular text-warning-primary">已暂停：{pausedReason}</p>}
            </div>
          </SetupStep>
        </div>
      )}

      <ConnectLooperModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        onConnected={() => void mutate()}
      />
    </SettingsContentWrapper>
  );
}

export default observer(LooperSettingsPage);
