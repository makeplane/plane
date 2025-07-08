import { Loader } from "@plane/ui";

export const DashboardLoaderTable = () => (
  <Loader>
    <div className="space-y-4">
      <Loader.Item height="26px" width="20%" />
      {/* table */}
      <div>
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={`${index}`} className=" relative flex items-center">
            {Array.from({ length: 7 }).map((_, childIndex) => (
              <div key={`${index}-${childIndex}`} className="p-1 w-full h-full">
                <Loader.Item className="" height="28px" width="100%" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </Loader>
);
