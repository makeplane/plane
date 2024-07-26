"use client";
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
  disabled?: boolean;
};

export const NewEmptyState: React.FC<Props> = ({
  title,
  description,
  image,
  primaryButton,
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
    <div className="flex items-center justify-center overflow-y-auto">
      <div className=" flex h-full w-full flex-col items-center justify-center ">
        <div className="m-5 flex max-w-6xl flex-col gap-5 rounded-xl border border-custom-border-200 px-10 py-7 shadow-sm md:m-8">
          <h3 className="text-2xl font-semibold">{title}</h3>
          {description && <p className=" text-lg">{description}</p>}
          <div className="relative w-full max-w-6xl">
            <Image src={image} className="w-full" alt={primaryButton?.text || "button image"} />
          </div>

          <div className="relative flex items-start justify-center">
            {primaryButton && (
              <Button
                className={`relative m-3 max-w-min !px-6 ${comicBox?.direction === "left" ? "flex-row-reverse" : ""}`}
                size="lg"
                variant="primary"
                onClick={primaryButton.onClick}
                disabled={disabled}
              >
                {primaryButton.text}
                <div
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className={`absolute bg-blue-300 ${
                    comicBox?.direction === "left" ? "left-0 ml-2" : "right-0 mr-2"
                  } z-10 h-2.5 w-2.5 animate-ping rounded-full`}
                />
                <div
                  className={`absolute bg-blue-400/40 ${
                    comicBox?.direction === "left" ? "left-0 ml-2.5" : "right-0 mr-2.5"
                  } h-1.5 w-1.5 rounded-full`}
                />
              </Button>
            )}
            {comicBox &&
              isHovered &&
              (comicBox.direction === "right" ? (
                <div
                  className={`absolute left-1/2 top-0 flex max-w-sm ${
                    comicBox?.extraPadding ? "ml-[125px]" : "ml-[90px]"
                  } pb-5`}
                >
                  <div className="relative mt-5 h-0 w-0 border-b-[11px] border-r-[11px] border-t-[11px] border-custom-border-200 border-y-transparent">
                    <div className="absolute right-[-12px] top-[-10px] h-0 w-0 border-b-[10px] border-r-[10px] border-t-[10px] border-custom-background-100 border-y-transparent" />
                  </div>
                  <div className="rounded-md border border-custom-border-200 bg-custom-background-100">
                    <h1 className="p-5">
                      <h3 className="text-lg font-semibold">{comicBox?.title}</h3>
                      <h4 className="mt-1 text-sm">{comicBox?.description}</h4>
                    </h1>
                  </div>
                </div>
              ) : (
                <div className="absolute right-1/2 top-0 mr-[90px] flex max-w-sm flex-row-reverse pb-5">
                  <div className="relative mt-5 h-0 w-0 border-b-[11px] border-l-[11px] border-t-[11px] border-custom-border-200 border-y-transparent">
                    <div className="absolute left-[-12px] top-[-10px] h-0 w-0 border-b-[10px] border-l-[10px] border-t-[10px] border-custom-background-100 border-y-transparent" />
                  </div>
                  <div className="rounded-md border border-custom-border-200 bg-custom-background-100">
                    <h1 className="p-5">
                      <h3 className="text-lg font-semibold">{comicBox?.title}</h3>
                      <h4 className="mt-1 text-sm">{comicBox?.description}</h4>
                    </h1>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
