import React from "react";

import Image from "next/image";

// ui
import { PrimaryButton } from "components/ui";

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
  <div className={`flex items-center justify-center h-full w-full`}>
    <div className="text-center flex flex-col items-center w-full">
      <Image src={image} className="w-52 sm:w-60" alt={primaryButton?.text} />
      <h6 className="text-xl font-semibold mt-6 sm:mt-8 mb-3">{title}</h6>
      {description && <p className="text-custom-text-300 mb-7 sm:mb-8">{description}</p>}
      <div className="flex items-center gap-4">
        {primaryButton && (
          <PrimaryButton className="flex items-center gap-1.5" onClick={primaryButton.onClick} disabled={disabled}>
            {primaryButton.icon}
            {primaryButton.text}
          </PrimaryButton>
        )}
        {secondaryButton}
      </div>
    </div>
  </div>
);
