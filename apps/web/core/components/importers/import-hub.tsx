/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { IMPORT_HUB_PROVIDERS } from "@plane/constants";
import type { TImportHubProvider } from "@plane/constants";
import { useAppRouter } from "@/hooks/use-app-router";
import { ImportProviderCard } from "./import-provider-card";
import { UnavailableImporterModal } from "./unavailable-importer-modal";

type Props = {
  workspaceSlug: string;
  disabled?: boolean;
};

export const ImportHub = observer(function ImportHub(props: Props) {
  const { workspaceSlug, disabled = false } = props;
  const router = useAppRouter();
  const [unavailableProvider, setUnavailableProvider] = useState<TImportHubProvider | null>(null);

  const handleImport = (provider: TImportHubProvider) => {
    if (provider.launch === "route" && provider.path) {
      router.push(`/${workspaceSlug}/settings/imports/${provider.path}`);
      return;
    }
    setUnavailableProvider(provider);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {IMPORT_HUB_PROVIDERS.map((provider) => (
          <ImportProviderCard key={provider.id} provider={provider} disabled={disabled} onImport={handleImport} />
        ))}
      </div>
      <UnavailableImporterModal
        provider={unavailableProvider}
        isOpen={Boolean(unavailableProvider)}
        onClose={() => setUnavailableProvider(null)}
      />
    </>
  );
});
