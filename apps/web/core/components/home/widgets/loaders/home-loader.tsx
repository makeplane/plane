import { range } from "lodash-es";
// ui
import { Loader } from "@plane/ui";

export function HomeLoader() {
  return (
    <>
      {range(3).map((index) => (
        <div key={index}>
          <div className="mb-2">
            <div className="mb-4 text-14 font-semibold text-tertiary">
              <Loader.Item height="20px" width="100px" />
            </div>
            <Loader className="flex h-[110px] w-full items-center justify-center gap-2 rounded-sm text-placeholder">
              <Loader.Item height="100%" width="100%" />
            </Loader>
          </div>
        </div>
      ))}
    </>
  );
}
