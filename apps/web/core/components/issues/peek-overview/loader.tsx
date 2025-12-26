import type { FC } from "react";
import { MoveRight } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { Loader } from "@plane/ui";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TIssuePeekOverviewLoader = {
  removeRoutePeekId: () => void;
};

export function IssuePeekOverviewLoader(props: TIssuePeekOverviewLoader) {
  const { removeRoutePeekId } = props;
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <Loader className="w-full h-screen overflow-hidden p-5 space-y-6">
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Tooltip tooltipContent="Close the peek view" isMobile={isMobile}>
            <button onClick={removeRoutePeekId}>
              <MoveRight className="h-4 w-4 text-tertiary hover:text-secondary" />
            </button>
          </Tooltip>
          <Loader.Item width="30px" height="30px" />
        </div>
        <div className="flex items-center gap-2">
          <Loader.Item width="80px" height="30px" />
          <Loader.Item width="30px" height="30px" />
          <Loader.Item width="30px" height="30px" />
          <Loader.Item width="30px" height="30px" />
        </div>
      </div>

      {/* issue title and description and comments */}
      <div className="space-y-3">
        <Loader.Item width="100px" height="20px" />

        <div className="space-y-1">
          <Loader.Item width="300px" height="15px" />
          <Loader.Item width="400px" height="15px" />
          <div className="flex items-center gap-2">
            <Loader.Item width="20px" height="15px" />
            <Loader.Item width="500px" height="15px" />
          </div>
          <div className="flex items-center gap-2">
            <Loader.Item width="20px" height="15px" />
            <Loader.Item width="200px" height="15px" />
          </div>
          <Loader.Item width="300px" height="15px" />
          <Loader.Item width="200px" height="15px" />
        </div>

        <Loader.Item width="30px" height="30px" />
      </div>

      {/* sub issues */}
      <div className="flex justify-between items-center gap-2">
        <Loader.Item width="80px" height="20px" />
        <Loader.Item width="100px" height="20px" />
      </div>

      {/* attachments */}
      <div className="space-y-3">
        <Loader.Item width="80px" height="20px" />
        <div className="flex items-center gap-2">
          <Loader.Item width="250px" height="50px" />
          <Loader.Item width="250px" height="50px" />
        </div>
      </div>

      {/* properties */}
      <div className="space-y-3">
        <Loader.Item width="80px" height="20px" />
        <div className="space-y-2">
          <div className="flex items-center gap-8">
            <Loader.Item width="150px" height="25px" />
            <Loader.Item width="150px" height="25px" />
          </div>
          <div className="flex items-center gap-8">
            <Loader.Item width="150px" height="25px" />
            <Loader.Item width="150px" height="25px" />
          </div>
          <div className="flex items-center gap-8">
            <Loader.Item width="150px" height="25px" />
            <Loader.Item width="150px" height="25px" />
          </div>
          <div className="flex items-center gap-8">
            <Loader.Item width="150px" height="25px" />
            <Loader.Item width="150px" height="25px" />
          </div>
          <div className="flex items-center gap-8">
            <Loader.Item width="150px" height="25px" />
            <Loader.Item width="150px" height="25px" />
          </div>
          <div className="flex items-center gap-8">
            <Loader.Item width="150px" height="25px" />
            <Loader.Item width="150px" height="25px" />
          </div>
        </div>
      </div>
    </Loader>
  );
}
