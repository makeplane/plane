/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTheme } from "next-themes";
import { STATUS_URL, SUPPORT_EMAIL, SUPPORT_URL } from "@plane/constants";
// plane imports
import { Button } from "@plane/propel/button";
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
  // hooks
  const { resolvedTheme } = useTheme();
  const supportHref = SUPPORT_URL || (SUPPORT_EMAIL ? `mailto:${SUPPORT_EMAIL}` : "");
  const linkMap = [
    supportHref ? { key: "support", label: "Contact Support", value: supportHref } : null,
    STATUS_URL ? { key: "status", label: "Status Page", value: STATUS_URL } : null,
  ].filter((link): link is { key: string; label: string; value: string } => link !== null);

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
            alt="ProjectSettingImg"
            className="h-full w-full object-fill object-center"
          />
        </div>
        <div className="relative mt-4 flex w-full flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <h1 className="text-left text-18 font-semibold text-primary">&#x1F6A7; Looks like something went wrong!</h1>
            <span className="text-left text-14 font-medium text-secondary">
              We track these errors automatically and working on getting things back up and running. If the problem
              persists feel free to contact us. In the meantime, try refreshing.
            </span>
          </div>

          {linkMap.length > 0 && (
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
          )}

          <div className="flex items-center justify-start gap-6">
            <Button variant="primary" size="lg" onClick={onGoHome}>
              Go to home
            </Button>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
