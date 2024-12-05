"use client";

import { FC } from "react";
import range from "lodash/range";
// components
import { ListLoaderItemRow } from "@/components/ui";

type TWorkspaceDraftIssuesLoader = {
  items?: number;
};

export const WorkspaceDraftIssuesLoader: FC<TWorkspaceDraftIssuesLoader> = (props) => {
  const { items = 14 } = props;
  return (
    <div className="relative h-full w-full">
      {range(items).map((index) => (
        <ListLoaderItemRow key={index} />
      ))}
    </div>
  );
};
