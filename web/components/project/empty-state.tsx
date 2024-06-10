"use client";

import React from "react";

import Image from "next/image";

// ui
import { Button } from "@plane/ui";

type Props = {
  title: string;
  description?: React.ReactNode;
  image: any;
  primaryButton?: {
    icon?: any;
    text: string;
    onClick: () => void;
  };
  secondaryButton?: React.ReactNode;
  disabled?: boolean;
};

export const EmptyState: React.FC<Props> = ({
  title,
  description,
  image,
  primaryButton,
  secondaryButton,
  disabled = false,
}) => (
  <div className="flex h-full w-full items-center justify-center px-5 md:px-10 lg:p-20">
    <div className="relative h-full w-full max-w-6xl">
      <Image src={image} className="w-52 sm:w-60" alt={primaryButton?.text ?? ""} layout="fill" />
    </div>
    <div className="absolute flex w-full flex-col items-center pt-[30vh] text-center md:pt-[35vh] lg:pt-[45vh]">
      <h6 className="mt-6 text-xl font-semibold">{title}</h6>
      {description && <p className="mb-7 text-custom-text-300">{description}</p>}
      <div className="flex items-center gap-4">
        {primaryButton && (
          <Button
            size="lg"
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
