/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { IMPORT_HUB_PROVIDER_BY_SERVICE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Badge } from "@plane/propel/badge";
import { Button } from "@plane/propel/button";
import type { TImportHubProvider } from "@plane/constants";
import { ImportProviderIcon } from "./provider-icon";

type Props = {
  provider: TImportHubProvider;
  disabled?: boolean;
  onImport: (provider: TImportHubProvider) => void;
};

export const ImportProviderCard = observer(function ImportProviderCard(props: Props) {
  const { provider, disabled = false, onImport } = props;
  const { t } = useTranslation();

  return (
    <div className="flex flex-col rounded-lg border border-subtle bg-layer-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <ImportProviderIcon providerId={provider.id} />
        {provider.beta && (
          <Badge variant="warning" size="sm">
            {t("common.beta")}
          </Badge>
        )}
      </div>
      <h3 className="mt-3 text-h6-medium text-primary">{t(provider.i18nLabel)}</h3>
      <p className="mt-1 grow text-13 text-secondary">{t(provider.i18nDescription)}</p>
      <div className="mt-4">
        <Button variant="secondary" size="sm" disabled={disabled} onClick={() => onImport(provider)}>
          {t("workspace_settings.settings.imports.hub.import")}
        </Button>
      </div>
    </div>
  );
});

export function getImportHubProviderLabel(service: string, translate: (key: string) => string) {
  const provider = IMPORT_HUB_PROVIDER_BY_SERVICE[service];
  if (provider) return translate(provider.i18nLabel);
  if (service === "github") return "GitHub";
  return service;
}
