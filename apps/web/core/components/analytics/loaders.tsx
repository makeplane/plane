import { Loader } from "@plane/ui";

export function ProjectInsightsLoader() {
  return (
    <div className="flex h-[200px] gap-1">
      <Loader className="h-full w-full">
        <Loader.Item height="100%" width="100%" />
      </Loader>
      <div className="flex h-full w-full flex-col gap-1">
        <Loader className="h-12 w-full">
          <Loader.Item height="100%" width="100%" />
        </Loader>
        <Loader className="h-full w-full">
          <Loader.Item height="100%" width="100%" />
        </Loader>
      </div>
    </div>
  );
}

export function ChartLoader() {
  return (
    <Loader className="h-[350px] w-full">
      <Loader.Item height="100%" width="100%" />
    </Loader>
  );
}
