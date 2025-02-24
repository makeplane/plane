// plane ui
import { Loader } from "@plane/ui";

export const StickiesLoader = () => (
  <div className="overflow-scroll pb-2 grid grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <Loader key={index} className="space-y-5 border border-custom-border-200 p-3 rounded">
        <div className="space-y-2">
          <Loader.Item height="20px" />
          <Loader.Item height="15px" width="75%" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader.Item height="15px" width="15px" className="flex-shrink-0" />
            <Loader.Item height="15px" width="100%" />
          </div>
          <div className="flex items-center gap-2">
            <Loader.Item height="15px" width="15px" className="flex-shrink-0" />
            <Loader.Item height="15px" width="75%" />
          </div>
          <div className="flex items-center gap-2">
            <Loader.Item height="15px" width="15px" className="flex-shrink-0" />
            <Loader.Item height="15px" width="90%" />
          </div>
          <div className="flex items-center gap-2">
            <Loader.Item height="15px" width="15px" className="flex-shrink-0" />
            <Loader.Item height="15px" width="60%" />
          </div>
          <div className="flex items-center gap-2">
            <Loader.Item height="15px" width="15px" className="flex-shrink-0" />
            <Loader.Item height="15px" width="50%" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Loader.Item height="25px" width="25px" />
            <Loader.Item height="25px" width="25px" />
            <Loader.Item height="25px" width="25px" />
          </div>
          <Loader.Item height="25px" width="25px" className="flex-shrink-0" />
        </div>
      </Loader>
    ))}
  </div>
);
