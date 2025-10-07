import React from "react";
import { Button } from "../button/button";
import { TButtonVariant } from "../button/helper";

export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: TButtonVariant;
  disabled?: boolean;
}

type TEmptyStateType = "detailed" | "simple";

export interface EmptyStateProps {
  asset?: React.ReactNode;
  title: string;
  description?: string;
  actions?: ActionButton[];
  className?: string;
  type?: TEmptyStateType;
}

const EmptyStateContent: React.FC<{
  title: string;
  description?: string;
  actions?: ActionButton[];
}> = ({ title, description, actions }) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-2">
      <h3 className="text-lg leading-7 font-semibold text-custom-text-100">{title}</h3>
      {description && <p className="text-sm leading-5 text-custom-text-300">{description}</p>}
    </div>

    {actions && actions.length > 0 && (
      <div className="flex flex-col sm:flex-row gap-4">
        {actions.map((action, index) => (
          <Button key={index} onClick={action.onClick} disabled={action.disabled} variant={action.variant}>
            {action.label}
          </Button>
        ))}
      </div>
    )}
  </div>
);

export const EmptyState: React.FC<EmptyStateProps> = ({
  asset,
  title,
  description,
  actions,
  className = "",
  type = "detailed",
}) => {
  const alignmentClass = type === "simple" ? "items-center text-center" : "text-left";

  return (
    <div className={`flex flex-col gap-6 justify-center ${alignmentClass} max-w-[25rem] ${className}`}>
      {asset && <div className="flex items-center max-w-40">{asset}</div>}
      <EmptyStateContent title={title} description={description} actions={actions} />
    </div>
  );
};
