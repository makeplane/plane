/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useState } from "react";
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
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    data,
    isLoading,
    error: loadError,
    mutate,
  } = useSWR(["INSTANCE_USERS", search, roleFilter, refreshKey], () =>
    instanceUserService.list({ search, role: roleFilter })
  );

  const rows = (data?.results ?? []) as TInstanceUser[];

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
        </div>
      }
    >
      <div className="p-6">
        <p className="mb-4 text-12 text-tertiary">
          系统管理员可为已有用户配置开发管理员、运维管理员和历史主 PI 标签。唯一主 PI
          请在工作空间管理中任命；职责标签不会扩大科研资料可见范围或自动授予私有空间席位。
        </p>
        {loadError ? (
          <div role="alert" className="flex items-center gap-3 text-12 text-danger-primary">
            <p>用户列表加载失败，请重试。</p>
            <Button variant="secondary" size="sm" stretch="auto" label="重试" onClick={() => void mutate()} />
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-10">
            <LoaderIcon className="h-4 w-4 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-12 text-tertiary">没有匹配的账号。</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-subtle">
            <table className="w-full text-12">
              <thead className="bg-surface-2 text-11 text-tertiary">
                <tr>
                  <th className="px-3 py-2 text-left">账号</th>
                  <th className="px-3 py-2 text-left">姓名</th>
                  <th className="px-3 py-2 text-left">工作空间</th>
                  <th className="px-3 py-2 text-left">身份标签</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr key={user.id} className="border-t border-subtle">
                    <td className="px-3 py-2 text-primary">{user.email}</td>
                    <td className="px-3 py-2 text-secondary">{user.display_name}</td>
                    <td className="px-3 py-2 text-secondary">{user.workspace_memberships.join(", ") || "-"}</td>
                    <td className="flex flex-wrap gap-2 px-3 py-2">
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
