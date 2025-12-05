import { range } from "lodash-es";
// ui
import { Loader } from "@plane/ui";

export function HomeLoader() {
  return (
    <>
      {range(3).map((index) => (
        <div key={index}>
          <div className="mb-2">
            <div className="text-14 font-semibold text-tertiary mb-4">
              <Loader.Item height="20px" width="100px" />
            </div>
            <Loader className="h-[110px] w-full flex items-center justify-center gap-2 text-placeholder rounded-sm">
              <Loader.Item height="100%" width="100%" />
            </Loader>
          </div>
        </div>
      ))}
    </>
  );
}
