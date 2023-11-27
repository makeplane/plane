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
  <div className="flex items-center lg:p-20 md:px-10 px-5 justify-center h-full w-full">
    <div className="relative h-full w-full max-w-6xl">
      <Image src={image} className="w-52 sm:w-60" alt={primaryButton?.text} layout="fill" />
    </div>
    <div className="absolute pt-[30vh] md:pt-[35vh] lg:pt-[45vh] text-center flex flex-col items-center w-full">
      <h6 className="text-xl font-semibold mt-6">{title}</h6>
      {description && <p className="text-custom-text-300 mb-7">{description}</p>}
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
