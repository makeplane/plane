// ui
import { Loader } from "@plane/ui";

export const IssuesByStateGroupWidgetLoader = () => (
  <Loader className="bg-custom-background-100 rounded-xl p-6">
    <Loader.Item height="17px" width="35%" />
    <div className="flex items-center justify-between gap-32 mt-12 pl-6">
      <div className="w-1/2 grid place-items-center">
        <div className="rounded-full overflow-hidden relative flex-shrink-0 h-[184px] w-[184px]">
          <Loader.Item height="184px" width="184px" />
          <div className="absolute h-[100px] w-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-custom-background-100 rounded-full" />
        </div>
      </div>
      <div className="w-1/2 space-y-7 flex-shrink-0">
        {Array.from({ length: 5 }).map((_, index) => (
          <Loader.Item key={index} height="11px" width="100%" />
        ))}
      </div>
    </div>
  </Loader>
);
