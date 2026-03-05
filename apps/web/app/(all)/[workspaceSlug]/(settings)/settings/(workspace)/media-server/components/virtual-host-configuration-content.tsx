import type { TVirtualHostState } from "../media-server.types";

type TVirtualHostConfigurationContentProps = {
  virtualHost: TVirtualHostState;
};

export const VirtualHostConfigurationContent = ({ virtualHost }: TVirtualHostConfigurationContentProps) => (
  <>
    <div className="flex items-center justify-between gap-4">
      <span className="text-custom-text-300">Name</span>
      <span>{virtualHost.name || "Not set"}</span>
    </div>
    <div className="flex items-center justify-between gap-4">
      <span className="text-custom-text-300">Host</span>
      <span>{virtualHost.hostName || "Not set"}</span>
    </div>
    <div className="flex items-start justify-between gap-4">
      <span className="text-custom-text-300">Control server</span>
      <span className="max-w-[70%] break-all text-right">{virtualHost.controlServerUrl || "Not set"}</span>
    </div>
  </>
);
