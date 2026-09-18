/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Input, Spinner } from "@plane/ui";
// hooks
import { useUser } from "@/hooks/store/user";

/**
 * Imported accounts start with a one-time credential
 * (`is_password_reset_required`). This gate forces the first change before the
 * workspace becomes usable (SYS-IMP-08).
 */
export const PasswordResetGate = observer(function PasswordResetGate() {
  const { t } = useTranslation();
  const { data: currentUser, changePassword } = useUser();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  if (!currentUser?.is_password_reset_required) return null;

  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword || mismatch) return;
    setSubmitting(true);
    try {
      const csrfToken = await fetch("/auth/get-csrf-token/", { credentials: "include" })
        .then((response) => response.json())
        .then((data) => data?.csrf_token as string);
      await changePassword(csrfToken, { old_password: oldPassword, new_password: newPassword });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("auth.common.password.toast.change_password.success.title"),
        message: t("auth.common.password.toast.change_password.success.message"),
      });
    } catch (error) {
      const payload = error as { error_code?: string } | undefined;
      setErrorKey(payload?.error_code ?? "auth.common.password.toast.change_password.error.message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="shadow-lg w-full max-w-md rounded-lg border border-subtle bg-surface-1 p-5">
        <h2 className="text-15 font-medium text-primary">{t("auth.common.password.first_login.title")}</h2>
        <p className="mt-1 text-12 text-tertiary">{t("auth.common.password.first_login.description")}</p>

        <div className="mt-4 flex flex-col gap-3">
          <Input
            type="password"
            value={oldPassword}
            onChange={(event) => setOldPassword(event.target.value)}
            placeholder={t("auth.common.password.first_login.current")}
          />
          <Input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder={t("auth.common.password.first_login.new")}
          />
          <Input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder={t("auth.common.password.first_login.confirm")}
          />
        </div>

        {mismatch && <p className="mt-2 text-11 text-danger-primary">{t("auth.common.password.mismatch")}</p>}
        {errorKey && <p className="mt-2 text-11 text-danger-primary">{t(errorKey)}</p>}

        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            loading={submitting}
            disabled={!oldPassword || !newPassword || mismatch}
            onClick={() => void handleSubmit()}
          >
            {t("auth.common.password.first_login.submit")}
          </Button>
        </div>
        {submitting && (
          <div className="mt-2 flex justify-center">
            <Spinner />
          </div>
        )}
      </div>
    </div>
  );
});

export default PasswordResetGate;
