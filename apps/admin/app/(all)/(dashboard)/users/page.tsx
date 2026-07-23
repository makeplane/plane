/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Search, ShieldCheck } from "lucide-react";
// gizmo imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { InstanceService } from "@plane/services";
import type { IInstanceUser } from "@plane/types";
import { Input, Loader } from "@plane/ui";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// types
import type { Route } from "./+types/page";

const instanceService = new InstanceService();

function UserRole({ user }: { user: IInstanceUser }) {
  if (user.instance_admin_role === 20)
    return (
      <span className="inline-flex items-center gap-1 text-accent-primary">
        <ShieldCheck className="size-4" />
        Суперадминистратор
      </span>
    );
  if (user.instance_admin_role === 15)
    return (
      <span className="inline-flex items-center gap-1 text-accent-primary">
        <ShieldCheck className="size-4" />
        Администратор экземпляра
      </span>
    );
  return <span className="text-secondary">Пользователь</span>;
}

const UsersPage = observer(function UsersPage(_props: Route.ComponentProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR(["INSTANCE_USERS", search, cursor], () =>
    instanceService.users(search, cursor)
  );

  const updateStatus = async (user: IInstanceUser) => {
    setUpdatingUserId(user.id);
    try {
      await instanceService.updateUser(user.id, { is_active: !user.is_active });
      await mutate();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Готово",
        message: user.is_active ? "Пользователь деактивирован" : "Пользователь активирован",
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Не удалось изменить статус",
        message: error?.error || "Попробуйте ещё раз",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <PageWrapper
      header={{
        title: "Пользователи экземпляра",
        description:
          "Управляйте всеми зарегистрированными пользователями Plane. Глобальные роли администраторов назначаются отдельно в общих настройках.",
      }}
    >
      <div className="space-y-5">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setCursor(undefined);
            setSearch(searchInput.trim());
          }}
        >
          <Input
            id="instance_user_search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Поиск по имени или email"
            className="w-full"
          />
          <Button type="submit" variant="primary" size="lg" prependIcon={<Search className="size-4" />}>
            Найти
          </Button>
        </form>

        {isLoading ? (
          <Loader className="space-y-3">
            <Loader.Item height="48px" />
            <Loader.Item height="48px" />
            <Loader.Item height="48px" />
          </Loader>
        ) : data?.results.length ? (
          <>
            <div className="overflow-x-auto rounded-md border border-subtle">
              <table className="w-full min-w-[760px] text-13">
                <thead className="bg-layer-1 text-tertiary">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Пользователь</th>
                    <th className="px-4 py-2 text-left font-medium">Глобальная роль</th>
                    <th className="px-4 py-2 text-left font-medium">Пространства</th>
                    <th className="px-4 py-2 text-left font-medium">Статус</th>
                    <th className="px-4 py-2 text-right font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {data.results.map((user) => (
                    <tr key={user.id} className="text-primary">
                      <td className="px-4 py-3">
                        <div>{user.display_name || `${user.first_name} ${user.last_name}`.trim() || user.email}</div>
                        <div className="text-11 text-tertiary">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <UserRole user={user} />
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {user.instance_admin_role ? "Все пространства" : user.workspace_count}
                      </td>
                      <td className="px-4 py-3">
                        <span className={user.is_active ? "text-success-primary" : "text-danger-primary"}>
                          {user.is_active ? "Активен" : "Деактивирован"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={updatingUserId === user.id}
                          disabled={Boolean(user.instance_admin_role)}
                          onClick={() => void updateStatus(user)}
                        >
                          {user.is_active ? "Деактивировать" : "Активировать"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-11 text-tertiary">Всего пользователей: {data.total_results}</div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!data.prev_page_results}
                  onClick={() => setCursor(data.prev_cursor)}
                >
                  Назад
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!data.next_page_results}
                  onClick={() => setCursor(data.next_cursor)}
                >
                  Далее
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-md border border-subtle px-4 py-10 text-center text-13 text-tertiary">
            Пользователи не найдены.
          </div>
        )}
      </div>
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Пользователи - God Mode" }];

export default UsersPage;
