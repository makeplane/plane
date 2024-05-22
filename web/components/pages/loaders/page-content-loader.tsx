// ui
import { Loader } from "@plane/ui";

export const PageContentLoader = () => (
  <div className="flex">
    <div className="w-[5%]" />
    <Loader className="flex-shrink-0 flex-grow">
      <div className="mt-10 space-y-2">
        <Loader.Item height="20px" />
        <Loader.Item height="20px" width="80%" />
        <Loader.Item height="20px" width="80%" />
      </div>
      <div className="mt-12 space-y-10">
        {Array.from(Array(4)).map((i) => (
          <div key={i}>
            <Loader.Item height="25px" width="20%" />
            <div className="mt-5 space-y-3">
              <Loader.Item height="15px" width="40%" />
              <Loader.Item height="15px" width="30%" />
              <Loader.Item height="15px" width="35%" />
            </div>
          </div>
        ))}
      </div>
    </Loader>
    <div className="w-[5%]" />
  </div>
);
