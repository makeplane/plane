import { store } from "@/lib/store-context";

export const getIsWorkspaceCreationDisabled = () => {
  const instanceConfig = store.instance.config;

  return instanceConfig?.is_workspace_creation_disabled;
};
