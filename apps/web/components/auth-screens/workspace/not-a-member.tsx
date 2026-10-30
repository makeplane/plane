/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import Link from "next/link";
// ui
import { Button } from "@makeplane/propel/components/button";
// layouts
import DefaultLayout from "@/layouts/default-layout";

export function NotAWorkspaceMember() {
  const { t } = useTranslation();

  return (
    <DefaultLayout>
      <div className="grid h-full place-items-center p-4">
        <div className="space-y-8 text-center">
          <div className="space-y-2">
            <h3 className="text-16 font-semibold">{t("web_ui.not_authorized")}</h3>
            <p className="mx-auto w-1/2 text-13 text-secondary">{t("web_ui.not_a_member")}</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              stretch="auto"
              label={t("web_ui.check_pending_invites")}
              nativeButton={false}
              render={<Link href="/invitations" />}
            />
            <Button
              variant="primary"
              size="sm"
              stretch="auto"
              label={t("web_ui.create_new_workspace")}
              nativeButton={false}
              render={<Link href="/create-workspace" />}
            />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
