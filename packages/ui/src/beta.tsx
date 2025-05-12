"use client";
import React from "react";
import { generateIconColors } from "@plane/utils";

export const BetaBadge = () => {
  const color = generateIconColors("CC7700");
  const textColor = color ? color.foreground : "transparent";
  const backgroundColor = color ? color.background : "transparent";
  return (
    <div
      className="w-fit cursor-pointer rounded text-center font-medium outline-none text-xs px-2 py-0.5  "
      style={{ color: textColor, backgroundColor: backgroundColor }}
    >
      Beta
    </div>
  );
};
