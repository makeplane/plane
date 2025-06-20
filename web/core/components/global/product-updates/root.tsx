import React from "react";
import { ChangelogPaginationData } from "@plane/types";
import { ContentItem } from "./content-item";

type ChangeLogContentRootProps = {
  data: ChangelogPaginationData | undefined;
};

export const ChangeLogContentRoot = (props: ChangeLogContentRootProps) => {
  const { data } = props;

  if (!data || data?.docs?.length <= 0) return <div className="text-center container my-[30vh]">No data available</div>;

  return (
    <div className="relative h-full mx-auto px-4 container">
      {data.docs.map((contentItem) => (
        <ContentItem key={contentItem.id} contentItem={contentItem} />
      ))}
    </div>
  );
};
