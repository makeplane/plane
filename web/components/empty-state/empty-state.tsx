import React from "react";
import Image from "next/image";
// components
import { ComicBoxButton } from "./comic-box-button";
// ui
import { Button, getButtonStyling } from "@plane/ui";
// helper
import { cn } from "helpers/common.helper";

type Props = {
  title: string;
  description?: string;
  image: any;
  primaryButton?: {
    icon?: any;
    text: string;
    onClick: () => void;
  };
  secondaryButton?: {
    icon?: any;
    text: string;
    onClick: () => void;
  };
  comicBox?: {
    title: string;
    description: string;
  };
  size?: "sm" | "lg";
  disabled?: boolean;
};

export const EmptyState: React.FC<Props> = ({
  title,
  description,
  image,
  primaryButton,
  secondaryButton,
  comicBox,
  size = "sm",
  disabled = false,
}) => {
  const emptyStateHeader = (
    <>
      {description ? (
        <>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm">{description}</p>
        </>
      ) : (
        <h3 className="text-xl font-medium">{title}</h3>
      )}
    </>
  );

  const secondaryButtonElement = secondaryButton && (
    <Button
      size={size === "sm" ? "md" : "lg"}
      variant="neutral-primary"
      prependIcon={secondaryButton.icon}
      onClick={secondaryButton.onClick}
      disabled={disabled}
    >
      {secondaryButton.text}
    </Button>
  );

  return (
    <div className="flex items-center justify-center min-h-full min-w-full overflow-y-auto py-10 px-20">
      <div
        className={cn("flex flex-col gap-5", {
          "min-w-[24rem] max-w-[45rem]": size === "sm",
          "min-w-[30rem] max-w-[60rem]": size === "lg",
        })}
      >
        <div className="flex flex-col gap-1.5 flex-shrink-0">{emptyStateHeader}</div>

        <Image
          src={image}
          alt={primaryButton?.text || "button image"}
          width={384}
          height={250}
          layout="responsive"
          lazyBoundary="100%"
        />

        <div className="relative flex items-center justify-center gap-2 flex-shrink-0 w-full">
          {primaryButton && (
            <>
              <div className="relative flex items-start justify-center">
                {comicBox ? (
                  <ComicBoxButton
                    label={primaryButton.text}
                    icon={primaryButton.icon}
                    title={comicBox?.title}
                    description={comicBox?.description}
                    onClick={() => primaryButton.onClick()}
                    disabled={disabled}
                  />
                ) : (
                  <div
                    className={`flex items-center gap-2.5 ${
                      disabled ? "cursor-not-allowed" : "cursor-pointer"
                    } ${getButtonStyling("primary", "lg", disabled)}`}
                    onClick={() => primaryButton.onClick()}
                  >
                    {primaryButton.icon}
                    <span className="leading-4">{primaryButton.text}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {secondaryButton && secondaryButtonElement}
        </div>
      </div>
    </div>
  );
};
