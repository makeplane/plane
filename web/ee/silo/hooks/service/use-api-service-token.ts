import { useEffect, useState } from "react";
import useSWR from "swr";
// silo services
import apiTokenService from "@/plane-web/silo/services/api-service-token.service";

export const useApiServiceToken = (workspaceSlug: string): any => {
  // state
  const [token, setToken] = useState<string | undefined>(undefined);

  // fetch service token
  const { data, isLoading, error, mutate } = useSWR(
    workspaceSlug ? `SERVICE_API_TOKEN_${workspaceSlug}` : null,
    workspaceSlug ? async () => await apiTokenService.createServiceApiToken(workspaceSlug) : null,
    { revalidateOnFocus: true, revalidateOnReconnect: true }
  );

  // update the token
  useEffect(() => {
    if ((!token && data) || (token && data && token !== data.token)) {
      setToken(data.token);
    }
  }, [data, token]);

  return {
    data: token,
    isLoading,
    error,
    mutate,
  };
};
