import React from "react";
import { Button } from "@plane/propel/button";

type Props = {
  title: string;
  description?: React.ReactNode;
  image?: string;
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
    <div className={`flex h-full w-full items-center justify-center`}>
      <div className="flex w-full flex-col items-center text-center">
        {image && <img src={image} className="w-52 sm:w-60" alt={primaryButton?.text || "button image"} />}
        <h6 className="mb-3 mt-6 text-18 font-semibold sm:mt-8">{title}</h6>
        {description && <p className="mb-7 px-5 text-tertiary sm:mb-8">{description}</p>}
        <div className="flex items-center gap-4">
          {primaryButton && (
            <Button
              variant="primary"
              prependIcon={primaryButton.icon}
              onClick={primaryButton.onClick}
              disabled={disabled}
              size="lg"
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
