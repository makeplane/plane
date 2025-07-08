import { useEffect, useState } from "react";
import useSWR from "swr";
import { CredentialService, TServiceAuthConfiguration, TImporterKeys } from "@plane/etl/core";
// silo hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";

type TUseSyncConfig = {
  data: TServiceAuthConfiguration | undefined;
  isLoading: boolean;
  error: Error | undefined;
  mutate: (data?: TServiceAuthConfiguration | undefined) => Promise<TServiceAuthConfiguration | undefined>;
};

export const useSyncConfig = (service: TImporterKeys): TUseSyncConfig => {
  // hooks
  const { workspaceId, userId, siloBaseUrl } = useBaseImporter();
  // service instance
  const syncService = new CredentialService(siloBaseUrl);
  // states
  const [config, setConfig] = useState<TServiceAuthConfiguration | undefined>(undefined);

  // fetch service config
  const { data, isLoading, error, mutate } = useSWR(
    siloBaseUrl ? `IMPORTER_CONFIG_${workspaceId}_${userId}_${service}` : null,
    siloBaseUrl ? async () => await syncService.isServiceConfigured(workspaceId, userId, service) : null
  );

  // update the config
  useEffect(() => {
    if ((!config && data) || (config && data && config.isAuthenticated !== data.isAuthenticated)) {
      setConfig(data);
    }
  }, [data]);

  return {
    data: config,
    isLoading,
    error,
    mutate,
  };
};
