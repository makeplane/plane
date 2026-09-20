/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { LoadingOutline as LoaderIcon } from "@makeplane/propel/icons";
// types
import { Button } from "@makeplane/propel/components/button";
import { InstanceUserService } from "@plane/services";
import type { TAdminRole, TInstanceUser } from "@plane/types";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { setToast, TOAST_TYPE } from "@/providers/toast";
// types
import type { Route } from "./+types/page";

const ADMIN_ROLES: { key: TAdminRole; label: string }[] = [
  { key: "DEV_ADMIN", label: "开发管理员" },
  { key: "OPS_ADMIN", label: "运维管理员" },
  { key: "MAIN_PI", label: "历史主 PI 标签（不等同任命）" },
];

const instanceUserService = new InstanceUserService();

/**
 * Users and administrator tags.
 *
 * God mode lists every registered account and hands out the three
 * administrator tags; the research settings page only mirrors them.
 */
const UserRoleManagementPage = observer(function UserRoleManagementPage(_props: Route.ComponentProps) {
  // states
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<TAdminRole | "">("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inactiveOnly, setInactiveOnly] = useState(false);
  const [importedOnly, setImportedOnly] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);

  const {
    data,
    isLoading,
    error: loadError,
    mutate,
  } = useSWR(["INSTANCE_USERS", search, roleFilter, inactiveOnly, importedOnly, refreshKey], () =>
    instanceUserService.list({
      search,
      role: roleFilter,
      ...(inactiveOnly ? { isActive: false } : {}),
      ...(importedOnly ? { imported: true } : {}),
    })
  );

  const rows = useMemo(() => (data?.results ?? []) as TInstanceUser[], [data?.results]);
  const visibleRows = rows;
  const selectableRows = visibleRows.filter((user) => user.import_source && user.is_active && !user.admin_roles.length);

  const toggleRole = useCallback(async (user: TInstanceUser, role: TAdminRole) => {
    setBusyUserId(user.id);
    try {
      if (user.admin_roles.includes(role)) {
        await instanceUserService.revokeRole(user.id, role);
      } else {
        await instanceUserService.assignRole(user.id, role);
      }
      setRefreshKey((key) => key + 1);
    } catch (error) {
      const payload = error as { error?: string } | undefined;
      setToast({ type: TOAST_TYPE.ERROR, title: "操作失败", message: payload?.error ?? "请稍后重试。" });
    } finally {
      setBusyUserId(null);
    }
  }, []);

  const runLifecycle = useCallback(
    async (action: "bulk" | "clear" | "toggle", user?: TInstanceUser) => {
      const label =
        action === "clear"
          ? `全部导入创建账号（当前页 ${rows.filter((item) => item.import_source && item.is_active).length} 个启用账号，范围：全部批次）`
          : action === "bulk"
            ? `${selectedIds.length} 个账号`
            : user?.email;
      const restoring = action === "toggle" && !user?.is_active;
      if (
        !window.confirm(
          restoring
            ? `确认恢复 ${label}？账号将重新启用。`
            : `确认删除（停用）${label}？账号将无法登录，业务和审计数据保留，可恢复。`
        )
      )
        return;
      setBusyUserId(user?.id ?? "bulk");
      setOperationMessage(null);
      try {
        if (action === "clear" || action === "bulk") {
          const result = await (action === "clear"
            ? instanceUserService.clearImported()
            : instanceUserService.bulkDeactivate(selectedIds));
          const reasons = (result.failed ?? []).map(
            (item: { id: string; reason: string }) =>
              `${rows.find((row) => row.id === item.id)?.email ?? item.id}：${item.reason}`
          );
          setOperationMessage(
            `已停用 ${result.success?.length ?? 0} 个，已跳过 ${result.skipped?.length ?? 0} 个，失败 ${result.failed?.length ?? 0} 个。${reasons.join("；")}`
          );
        } else if (user) {
          if (user.is_active) await instanceUserService.deactivate(user.id);
          else await instanceUserService.reactivate(user.id);
          setOperationMessage(restoring ? "账号已恢复。" : "账号已删除（停用），可通过“恢复”重新启用。");
        }
        setSelectedIds([]);
        setRefreshKey((key) => key + 1);
      } catch (error) {
        const payload = error as { error?: string } | undefined;
        setToast({ type: TOAST_TYPE.ERROR, title: "操作失败", message: payload?.error ?? "请稍后重试。" });
      } finally {
        setBusyUserId(null);
      }
    },
    [rows, selectedIds]
  );

  return (
    <PageWrapper
      customHeader={
        <div className="flex w-full flex-wrap items-center gap-3">
          <h1 className="text-18 font-medium">用户与角色</h1>
          <input
            className="rounded border border-subtle bg-transparent px-3 py-1.5 text-12"
            placeholder="搜索邮箱 / 姓名"
            aria-label="搜索用户邮箱或姓名"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="rounded border border-subtle bg-transparent px-3 py-1.5 text-12"
            value={roleFilter}
            aria-label="按身份标签筛选用户"
            onChange={(event) => setRoleFilter(event.target.value as TAdminRole | "")}
          >
            <option value="">全部标签</option>
            {ADMIN_ROLES.map((role) => (
              <option key={role.key} value={role.key}>
                {role.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-12 text-secondary">
            <input type="checkbox" checked={inactiveOnly} onChange={(event) => setInactiveOnly(event.target.checked)} />
            仅停用
          </label>
          <label className="flex items-center gap-2 text-12 text-secondary">
            <input type="checkbox" checked={importedOnly} onChange={(event) => setImportedOnly(event.target.checked)} />
            仅导入创建
          </label>
          <Button
            variant="secondary"
            size="sm"
            stretch="auto"
            disabled={!selectedIds.length || busyUserId !== null}
            label="批量删除（停用）"
            onClick={() => void runLifecycle("bulk")}
          />
          <Button
            variant="secondary"
            size="sm"
            stretch="auto"
            disabled={busyUserId !== null}
            label="清空导入账号（停用）"
            onClick={() => void runLifecycle("clear")}
          />
        </div>
      }
    >
      <div className="p-6">
        <p className="mb-4 text-12 text-tertiary">
          系统管理员可为已有用户配置开发管理员、运维管理员和历史主 PI 标签。唯一主 PI
          请在工作空间管理中任命；职责标签不会扩大科研资料可见范围或自动授予私有空间席位。
        </p>
        <p className="mb-4 text-12 text-tertiary">
          删除采用可恢复的停用方式，仅支持导入创建的账号。手工账号不在此删除；当前操作人、实例管理员及承担管理职责的账号受保护。
        </p>
        {operationMessage && (
          <p role="status" className="mb-4 text-12 text-secondary">
            {operationMessage}
          </p>
        )}
        {loadError ? (
          <div role="alert" className="flex items-center gap-3 text-12 text-danger-primary">
            <p>用户列表加载失败，请重试。</p>
            <Button variant="secondary" size="sm" stretch="auto" label="重试" onClick={() => void mutate()} />
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-10">
            <LoaderIcon className="h-4 w-4 animate-spin" />
          </div>
        ) : visibleRows.length === 0 ? (
          <p className="text-12 text-tertiary">没有匹配的账号。</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-subtle">
            <table className="w-full text-12">
              <thead className="bg-surface-2 text-11 text-tertiary">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      aria-label="全选可删除的导入账号"
                      disabled={busyUserId !== null || !selectableRows.length}
                      checked={
                        selectableRows.length > 0 && selectableRows.every((user) => selectedIds.includes(user.id))
                      }
                      onChange={(event) =>
                        setSelectedIds(event.target.checked ? selectableRows.map((user) => user.id) : [])
                      }
                    />
                  </th>
                  <th className="px-3 py-2 text-left">账号</th>
                  <th className="px-3 py-2 text-left">姓名</th>
                  <th className="px-3 py-2 text-left">工作空间</th>
                  <th className="px-3 py-2 text-left">身份标签</th>
                  <th className="px-3 py-2 text-left">来源 / 状态</th>
                  <th className="px-3 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((user) => (
                  <tr key={user.id} className="border-t border-subtle">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label={`选择 ${user.email}`}
                        disabled={busyUserId !== null || !selectableRows.some((item) => item.id === user.id)}
                        checked={selectedIds.includes(user.id)}
                        onChange={(event) =>
                          setSelectedIds((ids) =>
                            event.target.checked ? [...ids, user.id] : ids.filter((id) => id !== user.id)
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-primary">{user.email}</td>
                    <td className="px-3 py-2 text-secondary">{user.display_name}</td>
                    <td className="px-3 py-2 text-secondary">{user.workspace_memberships.join(", ") || "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        {ADMIN_ROLES.map((role) => {
                          const active = user.admin_roles.includes(role.key);
                          return (
                            <Button
                              key={role.key}
                              variant={active ? "primary" : "secondary"}
                              size="sm"
                              stretch="auto"
                              disabled={busyUserId === user.id}
                              label={role.label}
                              aria-pressed={active}
                              onClick={() => void toggleRole(user, role.key)}
                            />
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-secondary">
                      {user.import_source ? `导入 · ${user.import_source.kind}` : "手工"} /{" "}
                      {user.is_active ? "启用" : "停用"}
                    </td>
                    <td className="px-3 py-2">
                      {user.import_source && (!user.is_active || !user.admin_roles.length) ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          stretch="auto"
                          disabled={busyUserId !== null}
                          label={user.is_active ? "删除（停用）" : "恢复"}
                          onClick={() => void runLifecycle("toggle", user)}
                        />
                      ) : (
                        <span className="text-tertiary">
                          {user.admin_roles.length ? "管理账号受保护" : "手工账号不支持删除"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
});

export default UserRoleManagementPage;
