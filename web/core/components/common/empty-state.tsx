"use client";
import React from "react";
import Image from "next/image";
import { Button } from "@plane/ui";

type ImageProps = {
  src: string;
  width: number;
  height: number;
};

type Props = {
  title: string;
  description?: React.ReactNode;
  image: ImageProps;
  primaryButton?: {
    icon?: React.ReactNode;
    text: string;
    onClick: () => void;
  };
  secondaryButton?: React.ReactNode;
  disabled?: boolean;
};

const getImageSize = (baseSize: number) => {
  if (baseSize >= 1500) return { width: 960, height: 960 };
  if (baseSize >= 1000) return { width: 480, height: 480 };
  if (baseSize >= 500) return { width: 320, height: 320 };
  return {width: baseSize, height: baseSize}
};

export const EmptyState: React.FC<Props> = ({
  title,
  description,
  image,
  primaryButton,
  secondaryButton,
  disabled = false,
}) => {
  const baseSize = Math.max(image.width, image.height);
  const { width: scaledWidth, height: scaledHeight } = getImageSize(baseSize);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex w-full flex-col items-center text-center max-w-4xl">
        <div className="relative w-full" style={{ maxWidth: `${scaledWidth}px` }}>
          <Image
            src={image.src}
            alt={primaryButton?.text || "Empty state image"}
            layout="responsive"
            width={scaledWidth}
            height={scaledHeight}
            objectFit="contain"
            className="rounded-md"
          />
        </div>
        <h6 className="mb-3 mt-6 text-xl font-semibold sm:mt-8">{title}</h6>
        {description && (
          <p className="mb-7 px-5 text-custom-text-300 sm:mb-8">{description}</p>
        )}
        <div className="flex items-center gap-4">
          {primaryButton && (
            <Button
              variant="primary"
              prependIcon={primaryButton.icon}
              onClick={primaryButton.onClick}
              disabled={disabled}
            >
              {primaryButton.text}
            </Button>
          )}
          {secondaryButton}
        </div>
      </div>
    </div>
  );
};