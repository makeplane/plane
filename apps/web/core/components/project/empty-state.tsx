import React from "react";
// ui
import { Button } from "@plane/propel/button";

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

export function EmptyState({ title, description, image, primaryButton, secondaryButton, disabled = false }: Props) {
  return (
    <div className="flex h-full w-full items-center justify-center px-5 md:px-10 lg:p-20">
      <div className="relative h-full w-full max-w-6xl">
        <img src={image} className="w-52 sm:w-60 object-cover" alt={primaryButton?.text ?? ""} />
      </div>
      <div className="absolute flex w-full flex-col items-center pt-[30vh] text-center md:pt-[35vh] lg:pt-[45vh]">
        <h6 className="mt-6 text-18 font-semibold">{title}</h6>
        {description && <p className="mb-7 text-tertiary">{description}</p>}
        <div className="flex items-center gap-4">
          {primaryButton && (
            <Button
              size="xl"
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
}
