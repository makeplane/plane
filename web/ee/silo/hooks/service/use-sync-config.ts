import { useEffect, useState } from "react";
import useSWR from "swr";
import { SyncCredService, TSyncServiceConfigured, TSyncServices } from "@silo/core";
// silo hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";

export const useSyncConfig = (service: TSyncServices) => {
  // hooks
  const { workspaceId, userId, siloBaseUrl } = useBaseImporter();
  // service instance
  const syncService = new SyncCredService(siloBaseUrl);
  // states
  const [config, setConfig] = useState<TSyncServiceConfigured | undefined>(undefined);

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
