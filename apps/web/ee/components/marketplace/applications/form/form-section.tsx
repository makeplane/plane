import { PropsWithChildren, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@plane/ui";

type Props = {
  collapsible?: boolean;
  title: string;
} & PropsWithChildren;

export const FormSection = ({ collapsible, title, children }: Props) => {
  const [collapsibleOpen, setCollapsibleOpen] = useState(true);

  const handleToggle = () => {
    if (collapsible) {
      setCollapsibleOpen(!collapsibleOpen);
    }
  };

  return (
    <div className="bg-custom-background-90 rounded-lg p-6 flex flex-col gap-6">
      <div
        className={`flex items-center justify-between ${collapsible ? "cursor-pointer" : ""}`}
        onClick={handleToggle}
      >
        <h3 className="text-lg font-medium">{title}</h3>
        {collapsible && (
          <div className="flex items-center gap-2">
            <ChevronDown
              className={cn(`size-4 transition-transform duration-200 `, {
                "rotate-180": collapsibleOpen,
              })}
            />
          </div>
        )}
      </div>
      {(!collapsible || collapsibleOpen) && <div className="flex flex-col gap-4">{children}</div>}
    </div>
  );
};
