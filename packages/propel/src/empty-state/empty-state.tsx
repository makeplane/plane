import React from "react";
import { Button } from "../button/button";
import { TButtonVariant } from "../button/helper";

export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

export interface EmptyStateProps {
  asset?: React.ReactNode;
  title: string;
  description?: string;
  actions?: ActionButton[];
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ asset, title, description, actions, className = "" }) => (
  <div className={`flex flex-col gap-6 justify-center text-left max-w-[25rem] ${className}`}>
    {asset && <div className="flex items-center max-w-40">{asset}</div>}

    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg leading-7 font-semibold text-custom-text-100">{title}</h3>
        {description && <p className="text-sm leading-5 text-custom-text-300">{description}</p>}
      </div>

      {actions && actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              variant={action.variant as TButtonVariant}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  </div>
);
