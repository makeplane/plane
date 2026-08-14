/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Button } from "@plane/propel/button";
import { useTranslation } from "@plane/i18n";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import type { TImportHubProvider } from "@plane/constants";

type Props = {
  provider: TImportHubProvider | null;
  isOpen: boolean;
  onClose: () => void;
};

export function UnavailableImporterModal(props: Props) {
  const { provider, isOpen, onClose } = props;
  const { t } = useTranslation();

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="space-y-4 p-5">
        <h3 className="text-16 font-medium text-primary">
          {t("workspace_settings.settings.imports.hub.unavailable_title")}
        </h3>
        <p className="text-13 text-secondary">
          {t("workspace_settings.settings.imports.hub.unavailable_description", {
            provider: provider ? t(provider.i18nLabel) : "",
          })}
        </p>
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
