import { observer } from "mobx-react";
// hooks
import { useInstance } from "@/hooks/store";
// assets
import packageJson from "package.json";

export const PlaneVersionNumber = observer(() => {
  const { instance } = useInstance();

  if (instance?.product === "plane-one") {
    return <span>Version: ${instance.current_version || "Stable"}</span>;
  }

  if (process.env.NEXT_PUBLIC_DISCO_BASE_URL) {
    return <span>Version: Latest</span>;
  }

  return <span>Version: v{packageJson.version}</span>;
});
