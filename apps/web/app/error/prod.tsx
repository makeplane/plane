/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTheme } from "next-themes";
// gizmo imports
import { Button } from "@plane/propel/button";
// assets
import maintenanceModeDarkModeImage from "@/app/assets/instance/maintenance-mode-dark.svg?url";
import maintenanceModeLightModeImage from "@/app/assets/instance/maintenance-mode-light.svg?url";
// layouts
import DefaultLayout from "@/layouts/default-layout";

const linkMap = [
  {
    key: "mail_to",
    label: "Связаться с поддержкой",
    value: "mailto:support@gizmo.so",
  },
  {
    key: "status",
    label: "Страница статуса",
    value: "https://status.gizmo.so/",
  },
  {
    key: "twitter_handle",
    label: "@planepowers",
    value: "https://x.com/planepowers",
  },
];

// Production Error Component
interface ProdErrorComponentProps {
  onGoHome: () => void;
}

export function ProdErrorComponent({ onGoHome }: ProdErrorComponentProps) {
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
            alt="ProjectSettingImg"
            className="h-full w-full object-fill object-center"
          />
        </div>
        <div className="relative mt-4 flex w-full flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <h1 className="text-left text-18 font-semibold text-primary">&#x1F6A7; Похоже, что-то пошло не так!</h1>
            <span className="text-left text-14 font-medium text-secondary">
              Мы автоматически отслеживаем такие ошибки и работаем над восстановлением работы. Если проблема сохраняется,
              свяжитесь с нами. А пока попробуйте обновить страницу.
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
            <Button variant="primary" size="lg" onClick={onGoHome}>
              На главную
            </Button>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
