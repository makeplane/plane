import React from "react";
import { Megaphone } from "lucide-react";
// types
import { ChangelogDoc } from "@plane/types";
// components
import { RichTextNode } from "./jsxConverter";

type TContentItemProps = {
  contentItem: ChangelogDoc;
};

export const ContentItem = (props: TContentItemProps) => {
  const { contentItem } = props;

  if (!contentItem.published) return null;

  return (
    <div key={contentItem.id} className="relative mb-20 scroll-mt-[50px] lg:scroll-mt-[64px]">
      <div className="flex items-center gap-2 py-2 sticky top-0 z-10 bg-custom-background-100">
        <span className="size-8 rounded-full border flex items-center justify-center">
          <Megaphone className="size-6" />
        </span>
        <span className="text-neutral-text-primary text-xl font-bold">{contentItem.title}</span>
      </div>
      <RichTextNode id={Number(contentItem.id)} description={contentItem.description} />
    </div>
  );
};
