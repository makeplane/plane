/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { UseFormGetValues } from "react-hook-form";
// gizmo imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { IUserTheme } from "@plane/types";

type Props = {
  getValues: UseFormGetValues<IUserTheme>;
};

export const CustomThemeDownloadConfigButton = observer(function CustomThemeDownloadConfigButton(props: Props) {
  const { getValues } = props;
  // translation
  const { t } = useTranslation();

  const handleDownloadConfig = () => {
    try {
      const currentValues = getValues();
      const config = {
        version: "1.0",
        themeName: "Custom Theme",
        primary: currentValues.primary,
        background: currentValues.background,
        darkPalette: currentValues.darkPalette,
      };

      const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gizmo-theme-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: "Конфигурация темы успешно загружена.",
      });
    } catch (error) {
      console.error("Failed to download config:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: "Не удалось загрузить конфигурацию темы.",
      });
    }
  };

  return (
    <Button variant="secondary" size="lg" type="button" onClick={handleDownloadConfig}>
      Скачать конфигурацию
    </Button>
  );
});
