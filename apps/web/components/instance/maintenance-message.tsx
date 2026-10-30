import { useTranslation } from "@plane/i18n";
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export function MaintenanceMessage() {
  const { t } = useTranslation();

  const linkMap = [
    {
      key: "mail_to",
      label: t("web_ui.contact_support"),
      value: "mailto:support@plane.so",
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="text-left text-18 font-semibold text-primary">
          {t("web_ui.x1f6a7_looks_like_plane_didn_apos_t_start_up_correctly")}{" "}
        </h1>
        <span className="text-left text-14 font-medium text-secondary">
          {t("web_ui.some_services_might_have_failed_to_start_please_check_your_container_logs_to_identify_and_")}{" "}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-start gap-6">
        {linkMap.map((link) => (
          <div key={link.key}>
            <a
              href={link.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-13 text-accent-primary hover:underline"
            >
              {link.label}
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
