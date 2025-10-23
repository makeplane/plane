import React from "react";

type Props = {
  emptyText?: string;
};

export const PowerKMenuEmptyState: React.FC<Props> = ({ emptyText = "No results found" }) => (
  <div className="px-3 py-8 text-center text-sm text-custom-text-300">{emptyText}</div>
);
