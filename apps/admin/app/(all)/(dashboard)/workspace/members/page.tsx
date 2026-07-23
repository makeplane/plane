/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, Trash2, UserPlus } from "lucide-react";
// gizmo imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { InstanceWorkspaceService } from "@plane/services";
import type { IWorkspaceMember } from "@plane/types";
import { Input, Loader } from "@plane/ui";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// types
import type { Route } from "./+types/page";

const workspaceService = new InstanceWorkspaceService();

const roleLabels: Record<number, string> = {
  20: "Администратор пространства",
  15: "Участник",
  5: "Гость",
};

export default function WorkspaceMembersPage({ params }: Route.ComponentProps) {
  const workspaceId = params.workspaceId;
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(15);
  const [isAdding, setIsAdding] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();

  const { data: workspace } = useSWR(["INSTANCE_WORKSPACE", workspaceId], () => workspaceService.retrieve(workspaceId));
  const {
    data: membersData,
    isLoading,
    mutate,
  } = useSWR(["INSTANCE_WORKSPACE_MEMBERS", workspaceId, cursor], () =>
    workspaceService.members(workspaceId, "", cursor)
  );

  const addMember = async () => {
    if (!email.trim()) return;
    setIsAdding(true);
    try {
      await workspaceService.addMember(workspaceId, email.trim(), role);
      await mutate();
      setEmail("");
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Готово", message: "Пользователь добавлен в пространство" });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Не удалось добавить пользователя",
        message: error?.error || "Проверьте email и попробуйте ещё раз",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const updateRole = async (member: IWorkspaceMember, nextRole: number) => {
    setUpdatingMemberId(member.id);
    try {
      await workspaceService.updateMember(workspaceId, member.id, nextRole);
      await mutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Готово", message: "Роль в пространстве обновлена" });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Не удалось изменить роль",
        message: error?.error || "Попробуйте ещё раз",
      });
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const removeMember = async (member: IWorkspaceMember) => {
    setUpdatingMemberId(member.id);
    try {
      await workspaceService.removeMember(workspaceId, member.id);
      await mutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Готово", message: "Пользователь удалён из пространства" });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Не удалось удалить пользователя",
        message: error?.error || "Попробуйте ещё раз",
      });
    } finally {
      setUpdatingMemberId(null);
    }
  };

  return (
    <PageWrapper
      header={{
        title: workspace ? `Участники: ${workspace.name}` : "Участники пространства",
        description:
          "Добавляйте зарегистрированных пользователей и назначайте их локальные роли. Глобальные администраторы получают доступ автоматически.",
      }}
    >
      <div className="space-y-5">
        <Link href="/workspace" className="inline-flex items-center gap-1 text-13 text-secondary hover:text-primary">
          <ArrowLeft className="size-4" />
          Все пространства
        </Link>

        <div className="grid gap-2 md:grid-cols-[1fr_240px_auto]">
          <Input
            id="workspace_member_email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            className="w-full"
          />
          <select
            value={role}
            onChange={(event) => setRole(Number(event.target.value))}
            className="h-10 rounded-md border border-subtle bg-surface-1 px-3 text-13 text-primary outline-none"
          >
            <option value={15}>Участник</option>
            <option value={5}>Гость</option>
            <option value={20}>Администратор пространства</option>
          </select>
          <Button
            variant="primary"
            size="lg"
            prependIcon={<UserPlus className="size-4" />}
            loading={isAdding}
            disabled={!email.trim()}
            onClick={() => void addMember()}
          >
            Добавить
          </Button>
        </div>

        {isLoading ? (
          <Loader className="space-y-3">
            <Loader.Item height="48px" />
            <Loader.Item height="48px" />
          </Loader>
        ) : membersData?.results.length ? (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-md border border-subtle">
              <table className="w-full min-w-[720px] text-13">
                <thead className="bg-layer-1 text-tertiary">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Пользователь</th>
                    <th className="px-4 py-2 text-left font-medium">Доступ</th>
                    <th className="px-4 py-2 text-right font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {membersData.results.map((member) => {
                    const isGlobalAdmin = Boolean(member.is_instance_admin_access);
                    const isOwner = workspace?.owner.id === member.member.id;
                    return (
                      <tr key={member.id} className="text-primary">
                        <td className="px-4 py-3">
                          <div>{member.member.display_name || member.member.email}</div>
                          <div className="text-11 text-tertiary">{member.member.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          {isGlobalAdmin ? (
                            <span className="text-accent-primary">Глобальный администратор экземпляра</span>
                          ) : (
                            <select
                              value={Number(member.role)}
                              disabled={isOwner || updatingMemberId === member.id}
                              onChange={(event) => void updateRole(member, Number(event.target.value))}
                              className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary outline-none"
                            >
                              {Object.entries(roleLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isGlobalAdmin && !isOwner && (
                            <button
                              type="button"
                              title="Удалить из пространства"
                              disabled={updatingMemberId === member.id}
                              className="rounded-sm p-1.5 text-tertiary hover:bg-layer-1-hover hover:text-danger-primary"
                              onClick={() => void removeMember(member)}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-11 text-tertiary">Всего участников: {membersData.total_results}</div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!membersData.prev_page_results}
                  onClick={() => setCursor(membersData.prev_cursor)}
                >
                  Назад
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!membersData.next_page_results}
                  onClick={() => setCursor(membersData.next_cursor)}
                >
                  Далее
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-subtle px-4 py-10 text-center text-13 text-tertiary">
            В пространстве пока нет участников.
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "Участники пространства - God Mode" }];
