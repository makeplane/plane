import React from "react";
import { LucideIcon } from "lucide-react";
import { TableCell, TableRow } from "@plane/propel/table";

interface TableEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  colSpan: number;
  className?: string;
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  colSpan,
  className = "",
}) => (
  <TableRow>
    <TableCell colSpan={colSpan} className={`h-32 text-center ${className}`}>
      <div className="flex flex-col items-center justify-center text-custom-text-400">
        {Icon && <Icon className="h-8 w-8 mb-2 opacity-50" />}
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-custom-text-500 mt-1">{description}</p>}
      </div>
    </TableCell>
  </TableRow>
);
