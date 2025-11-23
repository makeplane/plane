import React from "react";

type Props = {
  emptyText?: string;
};

export function PowerKMenuEmptyState({ emptyText = "No results found" }: Props) {
  return <div className="px-3 py-8 text-center text-sm text-custom-text-300">{emptyText}</div>;
}
