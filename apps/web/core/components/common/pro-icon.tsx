"use client";

import { FC } from "react";
import { Crown } from "lucide-react";
// helpers
import { cn } from "@plane/utils";

type TProIcon = {
  className?: string;
};

export const ProIcon: FC<TProIcon> = (props) => {
  const { className } = props;

  return <Crown className={cn("inline-block h-3.5 w-3.5 text-amber-400", className)} />;
};
