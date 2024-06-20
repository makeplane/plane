// ui
import { Loader } from "@plane/ui";

export const PageContentLoader = () => (
  <div className="relative w-full h-full flex flex-col">
    {/* header */}
    <div className="px-4 flex-shrink-0 relative flex items-center justify-between h-12 border-b border-custom-border-100">
      {/* left options */}
      <Loader className="flex-shrink-0 w-[280px]">
        <Loader.Item width="26px" height="26px" />
      </Loader>

      {/* editor options */}
      <div className="w-full relative flex items-center divide-x divide-custom-border-100">
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

      {/* right options */}
      <Loader className="w-full relative flex justify-end items-center gap-1">
        <Loader.Item width="60px" height="26px" />
        <Loader.Item width="40px" height="26px" />
        <Loader.Item width="26px" height="26px" />
        <Loader.Item width="26px" height="26px" />
      </Loader>
    </div>

    {/* content */}
    <div className="px-4 w-full h-full overflow-hidden relative flex">
      {/* table of content loader */}
      <div className="flex-shrink-0 w-[280px] pr-5 py-5">
        <Loader className="w-full space-y-4">
          <Loader.Item width="100%" height="24px" />
          <div className="space-y-2">
            <Loader.Item width="60%" height="12px" />
            <div className="ml-6 space-y-2">
              <Loader.Item width="80%" height="12px" />
              <Loader.Item width="100%" height="12px" />
            </div>
            <Loader.Item width="60%" height="12px" />
            <div className="ml-6 space-y-2">
              <Loader.Item width="80%" height="12px" />
              <Loader.Item width="100%" height="12px" />
            </div>
            <Loader.Item width="100%" height="12px" />
            <Loader.Item width="60%" height="12px" />
            <div className="ml-6 space-y-2">
              <Loader.Item width="80%" height="12px" />
              <Loader.Item width="100%" height="12px" />
            </div>
            <Loader.Item width="80%" height="12px" />
            <Loader.Item width="100%" height="12px" />
          </div>
        </Loader>
      </div>

      {/* editor loader */}
      <div className="w-full h-full py-5">
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
