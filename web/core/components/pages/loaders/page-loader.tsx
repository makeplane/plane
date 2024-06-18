"use client";

import { Loader } from "@plane/ui";

export const PageLoader: React.FC = (props) => {
  const {} = props;

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="px-3 border-b border-custom-border-100 py-3">
        <Loader className="relative flex items-center gap-2">
          <Loader.Item width="200px" height="30px" />
          <div className="relative flex items-center gap-2 ml-auto">
            <Loader.Item width="100px" height="30px" />
            <Loader.Item width="100px" height="30px" />
          </div>
        </Loader>
      </div>
      <div>
        {Array.from(Array(10)).map((i) => (
          <Loader key={i} className="relative flex items-center gap-2 p-3 py-4 border-b border-custom-border-100">
            <Loader.Item width={`${250 + 10 * Math.floor(Math.random() * 10)}px`} height="22px" />
            <div className="ml-auto relative flex items-center gap-2">
              <Loader.Item width="60px" height="22px" />
              <Loader.Item width="22px" height="22px" />
              <Loader.Item width="22px" height="22px" />
              <Loader.Item width="22px" height="22px" />
            </div>
          </Loader>
        ))}
      </div>
    </div>
  );
};
