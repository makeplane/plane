"use client";

import React from "react";
import { observer } from "mobx-react";
import Image from "next/image";
// utils
import { cn } from "@plane/utils";

type EmptyStateSize = "sm" | "lg";

type Props = {
  title: string;
  description?: string;
  assetPath?: string;
  size?: EmptyStateSize;
};

const sizeConfig = {
  sm: {
    container: "size-24",
    dimensions: 78,
  },
  lg: {
    container: "size-28",
    dimensions: 96,
  },
} as const;

const getTitleClassName = (hasDescription: boolean) =>
  cn("font-medium whitespace-pre-line", {
    "text-sm text-custom-text-400": !hasDescription,
    "text-lg text-custom-text-300": hasDescription,
  });

export const SimpleEmptyState = observer((props: Props) => {
  const { title, description, size = "sm", assetPath } = props;

  return (
    <div className="text-center flex flex-col gap-2.5 items-center">
      {assetPath && (
        <div className={sizeConfig[size].container}>
          <Image
            src={assetPath}
            alt={title}
            height={sizeConfig[size].dimensions}
            width={sizeConfig[size].dimensions}
            layout="responsive"
            lazyBoundary="100%"
          />
        </div>
      )}

      <h3 className={getTitleClassName(!!description)}>{title}</h3>

      {description && <p className="text-base font-medium text-custom-text-400 whitespace-pre-line">{description}</p>}
    </div>
  );
});
