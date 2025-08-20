import { Loader } from "@plane/ui";

export const ConnectionLoader = () => (
  <div className="flex flex-col border border-custom-border-200 rounded p-4 mb-2 justify-center">
    {/* Icon and Title Section */}
    <div className="flex items-center gap-1">
      <Loader>
        <Loader.Item height="32px" width="32px" />
      </Loader>
      <Loader>
        <Loader.Item height="24px" width="80px" />
      </Loader>
    </div>

    {/* Description Section */}
    <div className="pt-2 pb-4">
      <Loader>
        <Loader.Item height="16px" width="100%" />
      </Loader>
    </div>

    {/* Connection Status Section */}
    <div className="rounded p-2 flex justify-between items-center border-[1px] border-custom-border-100">
      <div className="flex-1">
        <Loader>
          <Loader.Item height="16px" width="80%" />
        </Loader>
      </div>
      <Loader>
        <Loader.Item height="24px" width="64px" />
      </Loader>
    </div>
  </div>
);
