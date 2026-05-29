import { Crown } from "lucide-react";
// helpers
import { cn } from "@plane/utils";

type TProIcon = {
  className?: string;
};

export function ProIcon(props: TProIcon) {
  const { className } = props;

  return <Crown className={cn("text-amber-400 inline-block h-3.5 w-3.5", className)} />;
}
