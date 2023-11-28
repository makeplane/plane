import React, { useState } from "react";

import Image from "next/image";

// ui
import { Button } from "@plane/ui";

type Props = {
  title: string;
  description?: React.ReactNode;
  image: any;
  comicBox?: {
    direction: "left" | "right";
    title: string;
    description: string;
    extraPadding?: boolean;
  };
  primaryButton?: {
    icon?: any;
    text: string;
    onClick: () => void;
  };
  secondaryButton?: React.ReactNode;
  disabled?: boolean;
};

export const NewEmptyState: React.FC<Props> = ({
  title,
  description,
  image,
  primaryButton,
  secondaryButton,
  disabled = false,
  comicBox,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  return (
    <div className=" flex flex-col justify-center items-center h-full w-full ">
      <div className="border border-custom-border-200 rounded-xl px-10 py-7 flex flex-col gap-5 max-w-6xl m-5 md:m-16 shadow-sm">
        <h3 className="font-semibold text-2xl">{title}</h3>
        {description && <p className=" text-lg">{description}</p>}
        <div className="relative w-full max-w-6xl">
          <Image src={image} className="w-52 sm:w-60" alt={primaryButton?.text} />
        </div>

        <div className="flex justify-center items-start relative">
          {primaryButton && (
            <Button
              className={`max-w-min m-3 relative !px-6 ${comicBox?.direction === "left" ? "flex-row-reverse" : ""}`}
              size="lg"
              variant="primary"
              onClick={primaryButton.onClick}
              disabled={disabled}
            >
              {primaryButton.text}
              <div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`bg-blue-300 absolute ${
                  comicBox?.direction === "left" ? "left-0 ml-2" : "right-0 mr-2"
                } h-2.5 w-2.5 z-10 rounded-full animate-ping`}
              />
              <div
                className={`bg-blue-400/40 absolute ${
                  comicBox?.direction === "left" ? "left-0 ml-2.5" : "right-0 mr-2.5"
                } h-1.5 w-1.5 rounded-full`}
              />
            </Button>
          )}
          {comicBox &&
            isHovered &&
            (comicBox.direction === "right" ? (
              <div
                className={`flex max-w-sm absolute top-0 left-1/2 ${
                  comicBox?.extraPadding ? "ml-[125px]" : "ml-[90px]"
                } pb-5`}
              >
                <div className="relative w-0 h-0 border-t-[11px] mt-5 border-custom-border-200 border-b-[11px] border-r-[11px] border-y-transparent">
                  <div className="absolute top-[-10px] right-[-12px] w-0 h-0 border-t-[10px] border-custom-background-100 border-b-[10px] border-r-[10px] border-y-transparent" />
                </div>
                <div className="border border-custom-border-200 rounded-md bg-custom-background-100">
                  <h1 className="p-5">
                    <h3 className="font-semibold text-lg">{comicBox?.title}</h3>
                    <h4 className="text-sm mt-1">{comicBox?.description}</h4>
                  </h1>
                </div>
              </div>
            ) : (
              <div className="flex flex-row-reverse max-w-sm absolute top-0 right-1/2 mr-[90px] pb-5">
                <div className="relative w-0 h-0 border-t-[11px] mt-5 border-custom-border-200 border-b-[11px] border-l-[11px] border-y-transparent">
                  <div className="absolute top-[-10px] left-[-12px] w-0 h-0 border-t-[10px] border-custom-background-100 border-b-[10px] border-l-[10px] border-y-transparent" />
                </div>
                <div className="border border-custom-border-200 rounded-md bg-custom-background-100">
                  <h1 className="p-5">
                    <h3 className="font-semibold text-lg">{comicBox?.title}</h3>
                    <h4 className="text-sm mt-1">{comicBox?.description}</h4>
                  </h1>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
