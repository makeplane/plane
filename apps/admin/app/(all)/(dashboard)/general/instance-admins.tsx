/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { observer } from "mobx-react";
// gizmo imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { InstanceService } from "@plane/services";
import type { IInstanceAdmin } from "@plane/types";
import { Input } from "@plane/ui";
// hooks
import { useInstance, useUser } from "@/hooks/store";

type Props = {
  instanceAdmins: IInstanceAdmin[];
};

const instanceService = new InstanceService();

export const InstanceAdmins = observer(function InstanceAdmins(props: Props) {
  const { instanceAdmins } = props;
  const { currentUser } = useUser();
  const { fetchInstanceAdmins } = useInstance();
  const [email, setEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const currentUserAdmin = instanceAdmins.find((admin) => admin.user === currentUser?.id);
  const isSuperAdmin = currentUserAdmin?.role === 20;

  const addAdmin = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return;

    setIsAdding(true);
    try {
      await instanceService.createAdmin(normalizedEmail);
      await fetchInstanceAdmins();
      setEmail("");
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Готово", message: "Администратор получил доступ к God Mode" });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Не удалось назначить администратора",
        message: error?.error || "Проверьте, что пользователь уже зарегистрирован",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const removeAdmin = async (admin: IInstanceAdmin) => {
    setRemovingId(admin.id);
    try {
      await instanceService.deleteAdmin(admin.id);
      await fetchInstanceAdmins();
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Готово", message: "Доступ администратора отозван" });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Не удалось отозвать доступ",
        message: error?.error || "Попробуйте ещё раз",
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <div className="text-16 font-medium text-primary">Администраторы God Mode</div>
        <p className="mt-1 text-13 text-tertiary">
          Администраторы имеют полный доступ к God Mode. Только суперадминистратор может назначать и отзывать этот
          доступ.
        </p>
      </div>

      {isSuperAdmin && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="instance_admin_email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            className="w-full"
          />
          <Button
            variant="primary"
            size="lg"
            prependIcon={<UserPlus className="size-4" />}
            loading={isAdding}
            disabled={!email.trim()}
            onClick={() => void addAdmin()}
          >
            Назначить администратора
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-subtle">
        <table className="w-full text-13">
          <thead className="bg-layer-1 text-tertiary">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Пользователь</th>
              <th className="px-4 py-2 text-left font-medium">Роль</th>
              {isSuperAdmin && <th className="px-4 py-2 text-right font-medium">Действия</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {instanceAdmins.map((admin) => {
              const isSuper = admin.role === 20;
              return (
                <tr key={admin.id} className="text-primary">
                  <td className="px-4 py-3">
                    <div>{admin.user_detail.display_name || admin.user_detail.email}</div>
                    <div className="text-11 text-tertiary">{admin.user_detail.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={isSuper ? "text-accent-primary" : "text-secondary"}>
                      {isSuper ? "Суперадминистратор" : "Администратор"}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3 text-right">
                      {!isSuper && (
                        <button
                          type="button"
                          title="Отозвать доступ администратора"
                          className="rounded-sm p-1.5 text-tertiary hover:bg-layer-1-hover hover:text-danger-primary"
                          disabled={removingId === admin.id}
                          onClick={() => void removeAdmin(admin)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
});
