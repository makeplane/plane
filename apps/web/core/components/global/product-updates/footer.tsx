/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { BRAND_URL, DOCUMENTATION_URL, FEEDBACK_URL, SUPPORT_EMAIL, SUPPORT_URL } from "@plane/constants";
// components
import { BrandMark } from "@/components/common/brand-mark";
// hooks
import { useInstance } from "@/hooks/store/use-instance";

export function ProductUpdatesFooter() {
  const { t } = useTranslation();
  const { config } = useInstance();
  const supportHref = SUPPORT_URL || (SUPPORT_EMAIL ? `mailto:${SUPPORT_EMAIL}` : "");
  const changelogUrl = config?.instance_changelog_url || "";
  const links = [
    DOCUMENTATION_URL ? { label: t("docs"), href: DOCUMENTATION_URL } : null,
    changelogUrl ? { label: t("full_changelog"), href: changelogUrl } : null,
    supportHref ? { label: t("support"), href: supportHref } : null,
    FEEDBACK_URL ? { label: t("power_k.help_actions.report_bug"), href: FEEDBACK_URL } : null,
  ].filter((link): link is { label: string; href: string } => link !== null);

  if (links.length === 0 && !BRAND_URL) return null;

  return (
    <div className="m-6 mb-4 flex flex-shrink-0 items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {links.map((link, index) => (
          <span key={link.href} className="flex items-center gap-2">
            {index > 0 && (
              <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                <circle cx={1} cy={1} r={1} />
              </svg>
            )}
            <a
              href={link.href}
              target="_blank"
              className="text-13 text-secondary underline-offset-1 outline-none hover:text-primary hover:underline"
              rel="noreferrer"
            >
              {link.label}
            </a>
          </span>
        ))}
      </div>
      {BRAND_URL && (
        <a
          href={BRAND_URL}
          target="_blank"
          className="text-13 font-medium text-secondary underline-offset-2 outline-none hover:text-primary hover:underline"
          rel="noreferrer"
        >
          <BrandMark className="h-3 text-secondary" />
        </a>
      )}
    </div>
  );
}
