import type { FC } from "react";
import { range } from "lodash-es";
// components
import { ListLoaderItemRow } from "@/components/ui/loader/layouts/list-layout-loader";

type TWorkspaceDraftIssuesLoader = {
  items?: number;
};

export function WorkspaceDraftIssuesLoader(props: TWorkspaceDraftIssuesLoader) {
  const { items = 14 } = props;
  return (
    <div className="relative h-full w-full">
      {range(items).map((index) => (
        <ListLoaderItemRow key={index} />
      ))}
    </div>
  );
}
