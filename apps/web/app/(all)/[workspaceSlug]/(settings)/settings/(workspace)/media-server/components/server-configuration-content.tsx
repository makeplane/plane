type TServerConfigurationContentProps = {
  hostName: string;
};

export const ServerConfigurationContent = ({ hostName }: TServerConfigurationContentProps) => (
  <>
    <div className="flex items-center justify-between gap-4">
      <span className="text-custom-text-300">Host name</span>
      <span>{hostName || "Not set"}</span>
    </div>
    <div className="flex items-center justify-between gap-4">
      <span className="text-custom-text-300">Provider port</span>
      <span>1935</span>
    </div>
    <div className="flex items-center justify-between gap-4">
      <span className="text-custom-text-300">Publisher ports</span>
      <span>Non TLS: 3333, TLS: 3334</span>
    </div>
  </>
);
