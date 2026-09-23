/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { useTranslation } from "@plane/i18n";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import { CloseOutline } from "@makeplane/propel/icons";

export function ForgotPasswordPopover() {
  // plane hooks
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger
        render={<button type="button" className="text-11 font-medium text-accent-primary outline-none" />}
      >
        {t("auth.common.forgot_password")}
      </PopoverTrigger>
      {/* propel (ruling 33): `text` is the fixed-width (296px) info card; the legacy panel was a 256px card. */}
      <PopoverContent
        variant="text"
        side="right"
        align="start"
        sideOffset={12}
        collisionPadding={12}
        aria-label={t("auth.common.forgot_password")}
      >
        <div className="flex items-start gap-3 text-left">
          <span className="flex-shrink-0">🤥</span>
          <p className="text-11">{t("auth.forgot_password.errors.smtp_not_enabled")}</p>
          <PopoverClose
            render={
              <button
                type="button"
                className="grid size-3 flex-shrink-0 place-items-center"
                aria-label={t("aria_labels.auth_forms.close_popover")}
              />
            }
          >
            <CloseOutline className="size-3 text-secondary" />
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}
