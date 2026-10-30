/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useTheme } from "next-themes";
// plane imports
import { Button } from "@makeplane/propel/components/button";
// assets
import maintenanceModeDarkModeImage from "@/app/assets/instance/maintenance-mode-dark.svg?url";
import maintenanceModeLightModeImage from "@/app/assets/instance/maintenance-mode-light.svg?url";
// layouts
import DefaultLayout from "@/layouts/default-layout";

// Production Error Component
interface ProdErrorComponentProps {
  onGoHome: () => void;
}

export function ProdErrorComponent({ onGoHome }: ProdErrorComponentProps) {
  const { t } = useTranslation();
  const linkMap = [
    {
      key: "mail_to",
      label: t("web_ui.contact_support"),
      value: "mailto:support@plane.so",
    },
    {
      key: "status",
      label: t("cloud_maintenance_message.status_page"),
      value: "https://status.plane.so/",
    },
    {
      key: "twitter_handle",
      label: "@planepowers",
      value: "https://x.com/planepowers",
    },
  ];

  // hooks
  const { resolvedTheme } = useTheme();

  // derived values
  const maintenanceModeImage = resolvedTheme === "dark" ? maintenanceModeDarkModeImage : maintenanceModeLightModeImage;

  return (
    <DefaultLayout>
      <div className="relative container mx-auto flex h-full w-full max-w-xl flex-col items-center justify-center gap-2 gap-y-6 bg-surface-1 px-6 text-center">
        <div className="relative w-full">
          <img
            src={maintenanceModeImage}
            height="176"
            width="288"
            alt={t("web_ui.projectsettingimg")}
            className="h-full w-full object-fill object-center"
          />
        </div>
        <div className="relative mt-4 flex w-full flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <h1 className="text-left text-18 font-semibold text-primary">
              {t("web_ui.x1f6a7_looks_like_something_went_wrong")}
            </h1>
            <span className="text-left text-14 font-medium text-secondary">
              {t(
                "web_ui.we_track_these_errors_automatically_and_working_on_getting_things_back_up_and_running_if_t"
              )}{" "}
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

          <div className="flex items-center justify-start gap-6">
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              label={t("power_k.navigation_actions.nav_home")}
              onClick={onGoHome}
            />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
