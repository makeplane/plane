// plane imports
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  className?: string;
};

export function PageContentLoader(props: Props) {
  const { className } = props;

  return (
    <div className={cn("relative size-full flex flex-col", className)}>
      {/* header */}
      <div className="flex-shrink-0 w-full h-12 border-b border-subtle relative flex items-center divide-x divide-subtle">
        <Loader className="relative flex items-center gap-1 pr-2">
          <Loader.Item width="26px" height="26px" />
          <Loader.Item width="26px" height="26px" />
          <Loader.Item width="26px" height="26px" />
          <Loader.Item width="26px" height="26px" />
          <Loader.Item width="26px" height="26px" />
          <Loader.Item width="26px" height="26px" />
          <Loader.Item width="26px" height="26px" />
        </Loader>
        <Loader className="relative flex items-center gap-1 px-2">
          <Loader.Item width="26px" height="26px" />
          <Loader.Item width="26px" height="26px" />
        </Loader>
        <Loader className="relative flex items-center gap-1 px-2">
          <Loader.Item width="26px" height="26px" />
          <Loader.Item width="26px" height="26px" />
        </Loader>
        <Loader className="relative flex items-center gap-1 pl-2">
          <Loader.Item width="26px" height="26px" />
          <Loader.Item width="26px" height="26px" />
        </Loader>
      </div>

      {/* content */}
      <div className="size-full pt-[64px] overflow-hidden relative flex">
        {/* editor loader */}
        <div className="size-full py-5">
          <Loader className="relative space-y-4">
            <Loader.Item width="50%" height="36px" />
            <div className="space-y-2">
              <div className="py-2">
                <Loader.Item width="100%" height="36px" />
              </div>
              <Loader.Item width="80%" height="22px" />
              <div className="relative flex items-center gap-2">
                <Loader.Item width="30px" height="30px" />
                <Loader.Item width="30%" height="22px" />
              </div>
              <div className="py-2">
                <Loader.Item width="60%" height="36px" />
              </div>
              <Loader.Item width="70%" height="22px" />
              <Loader.Item width="30%" height="22px" />
              <div className="relative flex items-center gap-2">
                <Loader.Item width="30px" height="30px" />
                <Loader.Item width="30%" height="22px" />
              </div>
              <div className="py-2">
                <Loader.Item width="50%" height="30px" />
              </div>
              <Loader.Item width="100%" height="22px" />
              <div className="py-2">
                <Loader.Item width="30%" height="30px" />
              </div>
              <Loader.Item width="30%" height="22px" />
              <div className="relative flex items-center gap-2">
                <div className="py-2">
                  <Loader.Item width="30px" height="30px" />
                </div>
                <Loader.Item width="30%" height="22px" />
              </div>
            </div>
          </Loader>
        </div>
      </div>
    </div>
  );
}
