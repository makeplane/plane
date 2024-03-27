import { FC } from "react";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import { TPageNavigationTabs } from "@plane/types";

type TPageEmptyState = {
  description?: string;
  image: string | StaticImport;
  pageType: TPageNavigationTabs;
  title?: string;
};

export const PageEmptyState: FC<TPageEmptyState> = (props) => {
  const { image, title = "No pages", description = "No pages are available." } = props;

  return (
    <div className="h-full w-full grid place-items-center">
      <div className="text-center">
        <Image src={image} className="h-36 sm:h-48 w-36 sm:w-48 mx-auto" alt="No matching modules" />
        <h5 className="text-xl font-medium mt-7 mb-1">{title}</h5>
        <p className="text-custom-text-400 text-base">{description}</p>
      </div>
    </div>
  );
};
