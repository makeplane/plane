// ui
import { Loader } from "@plane/ui";

export const TeamspaceEntitiesLoader = ({ count }: { count: number }) => (
  <div className="flex flex-col pt-4 w-full h-full">
    <Loader className="w-full h-full flex flex-col gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <Loader.Item height="28px" width="100%" key={index} />
      ))}
    </Loader>
  </div>
);
