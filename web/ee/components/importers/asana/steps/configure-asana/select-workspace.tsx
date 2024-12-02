"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Loader } from "@plane/ui";
import { AsanaWorkspace } from "@silo/asana";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";

type TConfigureAsanaSelectWorkspace = {
  value: string | undefined;
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureAsanaSelectWorkspace: FC<TConfigureAsanaSelectWorkspace> = observer((props) => {
  // props
  const { value, handleFormData } = props;
  // hooks
  const {
    workspace,
    user,
    handleSyncJobConfig,
    data: { asanaWorkspaceIds, getAsanaWorkspaceById, fetchAsanaWorkspaces },
  } = useAsanaImporter();
  // derived values
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const asanaWorkspaces = ((asanaWorkspaceIds || []).map((id) => getAsanaWorkspaceById(id)) || []).filter(
    (workspace) => workspace && workspace.gid
  ) as AsanaWorkspace[];
  // handlers
  const handelData = (value: string | undefined) => {
    handleFormData(value);
    // updating the config data
    if (value) {
      const workspaceData = getAsanaWorkspaceById(value);
      if (workspaceData) handleSyncJobConfig("workspace", workspaceData);
    }
  };

  // fetching the asana workspaces
  const { isLoading } = useSWR(
    workspaceId && userId ? `IMPORTER_ASANA_WORKSPACES_${workspaceId}` : null,
    workspaceId && userId ? async () => fetchAsanaWorkspaces(workspaceId, userId) : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="space-y-2">
      <div className="text-sm text-custom-text-200">Select Asana workspace</div>
      {isLoading && (!asanaWorkspaces || asanaWorkspaces.length === 0) ? (
        <Loader>
          <Loader.Item height="28px" width="100%" />
        </Loader>
      ) : (
        <Dropdown
          dropdownOptions={(asanaWorkspaces || [])?.map((workspace) => ({
            key: workspace.gid,
            label: workspace.name,
            value: workspace.gid,
            data: workspace,
          }))}
          value={value}
          placeHolder={isLoading ? "Loading Asana workspaces" : "Select Asana workspace"}
          onChange={(value: string | undefined) => handelData(value)}
          queryExtractor={(option) => option.name}
          disabled={isLoading}
        />
      )}
    </div>
  );
});
