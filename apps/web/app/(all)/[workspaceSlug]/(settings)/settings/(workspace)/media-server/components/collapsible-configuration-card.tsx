import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type TCollapsibleConfigurationCardProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export const CollapsibleConfigurationCard = ({
  title,
  isOpen,
  onToggle,
  children,
}: TCollapsibleConfigurationCardProps) => (
  <section className="overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100">
    <button
      type="button"
      className="flex w-full items-center justify-between border-b border-custom-border-100 px-4 py-3"
      onClick={onToggle}
    >
      <span className="text-base font-medium text-custom-text-100">{title}</span>
      {isOpen ? (
        <ChevronUp className="h-4 w-4 text-custom-text-300" />
      ) : (
        <ChevronDown className="h-4 w-4 text-custom-text-300" />
      )}
    </button>

    {isOpen && <div className="space-y-3 p-4 text-sm text-custom-text-200">{children}</div>}
  </section>
);
