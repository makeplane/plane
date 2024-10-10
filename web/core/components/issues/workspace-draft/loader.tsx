"use client";

import { FC } from "react";
// components
import { ListLoaderItemRow } from "@/components/ui";

type TWorkspaceDraftIssuesLoader = {
  items?: number;
};

export const WorkspaceDraftIssuesLoader: FC<TWorkspaceDraftIssuesLoader> = (props) => {
  const { items = 14 } = props;
  return (
    <div className="relative h-full w-full">
      {[...Array(items)].map((_, index) => (
        <ListLoaderItemRow key={index} />
      ))}
    </div>
  );
};
