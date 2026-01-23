import React from "react";
import Link from "next/link";
// plane imports
import { cn } from "@plane/utils";
import type { LucideIcon } from "lucide-react";
import type { ISvgIcons } from "@plane/propel/icons";

type Props = {
  isActive: boolean;
  label: string;
} & ({ as: "button"; onClick: () => void } | { as: "link"; href: string }) &
  (
    | {
        icon: LucideIcon | React.FC<ISvgIcons>;
      }
    | { iconNode: React.ReactElement }
  );

export function SettingsSidebarItem(props: Props) {
  const { as, isActive, label } = props;
  // common class
  const className = cn(
    "flex items-center gap-2 py-1.5 px-2 rounded-lg text-body-sm-medium text-secondary text-left transition-colors",
    {
      "bg-layer-transparent-selected text-primary": isActive,
      "hover:bg-layer-transparent-hover": !isActive,
    }
  );
  // common content
  const content = (
    <>
      {"icon" in props ? (
        <span className="shrink-0 size-4 grid place-items-center">{<props.icon className="size-3.5" />}</span>
      ) : (
        props.iconNode
      )}
      <span className="truncate">{label}</span>
    </>
  );

  if (as === "button") {
    return (
      <button type="button" className={className} onClick={props.onClick}>
        {content}
      </button>
    );
  }

  return (
    <Link className={className} href={props.href}>
      {content}
    </Link>
  );
}
