/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";

// plane internal packages
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { Button } from "@makeplane/propel/components/button";
import { NewTabOutline } from "@makeplane/propel/icons";
import { WEB_BASE_URL } from "@plane/constants";
import type { TWorkspaceResearchPurpose } from "@plane/types";
import { getFileURL } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store";

type TWorkspaceListItemProps = {
  workspaceId: string;
};

const PURPOSE_LABELS: Record<TWorkspaceResearchPurpose, string> = {
  GENERAL: "普通工作空间",
  PUBLIC_RESEARCH: "公共科研空间",
  PI_PRIVATE: "主 PI 私有空间",
};

export const WorkspaceListItem = observer(function WorkspaceListItem({ workspaceId }: TWorkspaceListItemProps) {
  // store hooks
  const { getWorkspaceById, updateResearchConfiguration } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mainPi, setMainPi] = useState("");
  const [privateUsers, setPrivateUsers] = useState("");
  const [purpose, setPurpose] = useState<TWorkspaceResearchPurpose>("GENERAL");
  const [moduleEnabled, setModuleEnabled] = useState(false);
  const [saveError, setSaveError] = useState("");
  // derived values
  const workspace = getWorkspaceById(workspaceId);

  useEffect(() => {
    if (!workspace) return;
    setMainPi(workspace.main_pi ?? "");
    setPrivateUsers((workspace.private_access_users ?? []).join(", "));
    setPurpose(workspace.research_purpose ?? "GENERAL");
    setModuleEnabled(Boolean(workspace.research_enabled));
    setSaveError("");
  }, [workspace]);

  if (!workspace) return null;

  const toggleResearchConfiguration = () => {
    if (!editing) {
      setMainPi(workspace.main_pi ?? "");
      setPrivateUsers((workspace.private_access_users ?? []).join(", "));
      setPurpose(workspace.research_purpose ?? "GENERAL");
      setModuleEnabled(Boolean(workspace.research_enabled));
      setSaveError("");
    }
    setEditing((value) => !value);
  };

  const saveResearchAccess = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const payload: Parameters<typeof updateResearchConfiguration>[1] = {
        purpose,
        main_pi: mainPi.trim() || null,
        module_enabled: purpose === "PI_PRIVATE" ? false : moduleEnabled,
      };
      if (purpose === "PI_PRIVATE") {
        payload.private_access_users = privateUsers
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
      await updateResearchConfiguration(workspaceId, payload);
      setEditing(false);
    } catch (error) {
      const payload = error as { error?: string } | undefined;
      setSaveError(payload?.error ?? "保存失败，请检查填写内容后重试。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-subtle bg-layer-1 p-3">
      <div className="group flex items-center justify-between gap-2.5 truncate">
        <div className="flex items-start gap-4">
          <span
            className={`relative mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center p-2 text-11 uppercase ${
              !workspace?.logo_url && "rounded-lg bg-accent-primary text-on-color"
            }`}
          >
            {workspace?.logo_url && workspace.logo_url !== "" ? (
              <img
                src={getFileURL(workspace.logo_url)}
                className="absolute top-0 left-0 h-full w-full rounded-sm object-cover"
                alt="工作空间图标"
              />
            ) : (
              (workspace?.name?.[0] ?? "...")
            )}
          </span>
          <div className="flex flex-col items-start gap-1">
            <div className="flex w-full flex-wrap items-center gap-2.5">
              <h3 className="text-14 font-medium capitalize">{workspace.name}</h3>
              <Tooltip label="工作空间的唯一地址">
                <h4 className="text-13 text-tertiary">[{workspace.slug}]</h4>
              </Tooltip>
            </div>
            {workspace.owner.email && (
              <div className="flex items-center gap-1 text-11">
                <h3 className="font-medium text-secondary">所有者：</h3>
                <h4 className="text-tertiary">{workspace.owner.email}</h4>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-11">
              {workspace.total_projects !== null && (
                <span className="flex items-center gap-1">
                  <h3 className="font-medium text-secondary">项目：</h3>
                  <h4 className="text-tertiary">{workspace.total_projects}</h4>
                </span>
              )}
              {workspace.total_members !== null && (
                <>
                  •
                  <span className="flex items-center gap-1">
                    <h3 className="font-medium text-secondary">成员：</h3>
                    <h4 className="text-tertiary">{workspace.total_members}</h4>
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-11 text-tertiary">
              <span>{PURPOSE_LABELS[workspace.research_purpose ?? "GENERAL"]}</span>
              <span>•</span>
              <span>科研模块：{workspace.research_enabled ? "已启用" : "已关闭"}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            stretch="auto"
            label={editing ? "收起配置" : "科研与准入"}
            onClick={toggleResearchConfiguration}
          />
          <a
            href={`${WEB_BASE_URL}/${encodeURIComponent(workspace.slug)}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`打开${workspace.name}`}
          >
            <NewTabOutline width={14} height={16} className="text-placeholder group-hover:text-secondary" />
          </a>
        </div>
      </div>
      {editing && (
        <div className="mt-3 grid gap-3 border-t border-subtle pt-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-11 text-secondary">
            <span>工作空间用途</span>
            <select
              className="rounded border border-subtle bg-transparent px-2 py-1.5 text-12"
              value={purpose}
              onChange={(event) => {
                const nextPurpose = event.target.value as TWorkspaceResearchPurpose;
                setPurpose(nextPurpose);
                if (nextPurpose === "PI_PRIVATE") setModuleEnabled(false);
              }}
            >
              {Object.entries(PURPOSE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end pb-1.5 text-11 text-secondary">
            <input
              type="checkbox"
              checked={moduleEnabled}
              disabled={purpose === "PI_PRIVATE"}
              onChange={(event) => setModuleEnabled(event.target.checked)}
            />
            <span>{purpose === "PI_PRIVATE" ? "主 PI 私有空间强制关闭科研模块" : "启用科研模块"}</span>
          </label>
          {purpose !== "GENERAL" && (
            <label className="flex flex-col gap-1 text-11 text-secondary">
              <span>唯一主 PI（邮箱或用户 ID）</span>
              <input
                className="rounded border border-subtle bg-transparent px-2 py-1.5 text-12"
                value={mainPi}
                placeholder="留空表示暂不指定"
                onChange={(event) => setMainPi(event.target.value)}
              />
            </label>
          )}
          {purpose === "PI_PRIVATE" && (
            <label className="flex flex-col gap-1 text-11 text-secondary">
              <span>额外准入用户 ID（逗号分隔）</span>
              <input
                className="rounded border border-subtle bg-transparent px-2 py-1.5 text-12"
                value={privateUsers}
                placeholder="开发/运维管理员必须在此显式授权"
                onChange={(event) => setPrivateUsers(event.target.value)}
              />
            </label>
          )}
          {saveError && (
            <p role="alert" className="text-11 text-danger-primary md:col-span-2">
              {saveError}
            </p>
          )}
          <div className="flex items-end">
            <Button
              variant="primary"
              size="sm"
              stretch="auto"
              loading={saving}
              label="保存配置"
              onClick={() => void saveResearchAccess()}
            />
          </div>
        </div>
      )}
    </div>
  );
});
