import { FC, Fragment } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { PageHead } from "@/components/core";
import { useProjectPages, usePage } from "@/hooks/store";
// components
import { PageDetailRootLoader } from "./";

type TPageDetailRoot = {
  projectId: string;
  pageId: string;
};

export const PageDetailRoot: FC<TPageDetailRoot> = observer((props) => {
  const { projectId, pageId } = props;
  // hooks
  const { loader } = useProjectPages(projectId);
  const { id, name } = usePage(pageId);

  if (loader === "init-loader") return <PageDetailRootLoader />;

  if (!id) return <div className="">No page is available.</div>;

  return (
    <Fragment>
      <PageHead title={name || "Pages"} />

      <div className="relative w-full h-full flex flex-col">
        <div className="flex-shrink-0 px-4 relative flex items-center justify-between h-12 border-b border-custom-border-100">
          {/* header left container */}
          <div className="flex-shrink-0 w-[280px]">Icon</div>
          {/* header editor tool container */}
          <div className="w-full relative hidden md:flex items-center divide-x divide-custom-border-100 ">
            Editor keys
          </div>
          {/* header right operations container */}
          <div className="w-full relative flex justify-end">right saved</div>
        </div>

        {/* editor container for small screens */}
        <div className="px-4 h-12 relative flex md:hidden items-center border-b border-custom-border-100">
          Editor keys
        </div>

        <div className="px-4 w-full h-full overflow-hidden relative flex">
          {/* editor table of content content container */}
          <div className="flex-shrink-0 w-[280px] pr-5 py-5">Table of content</div>
          {/* editor container */}
          <div className="w-full h-full py-5">Editor Container</div>
        </div>
      </div>
    </Fragment>
  );
});
