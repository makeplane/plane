import { Loader } from "@plane/ui";

export const MappingLoader = () => (
  <div className="relative w-full space-y-4">
    <div className="border border-custom-border-200 rounded-md overflow-hidden">
      <Loader>
        {/* Header skeleton */}
        <div className="flex flex-row items-center justify-between py-3 px-4 bg-custom-background-90 border-b border-custom-border-200">
          <div className="space-y-1">
            <Loader.Item height="24px" width="180px" />
            <Loader.Item height="18px" width="280px" />
          </div>
          <Loader.Item height="32px" width="32px" className="rounded" />
        </div>

        {/* Content skeleton */}
        <div className="p-4 bg-custom-background-100">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex border border-custom-border-200 rounded-md p-3 gap-4">
                <Loader.Item height="36px" width="100%" />
                <Loader.Item height="32px" width="32px" className="rounded-full flex-shrink-0" />
                <Loader.Item height="36px" width="100%" />
              </div>
            ))}
          </div>
        </div>
      </Loader>
    </div>
  </div>
);
