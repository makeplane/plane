import * as React from "react";

import { cn } from "../utils/classname";

const Table = React.forwardRef<React.ComponentRef<"table">, React.ComponentPropsWithoutRef<"table">>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<React.ComponentRef<"thead">, React.ComponentPropsWithoutRef<"thead">>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn("bg-custom-background-80 py-4 border-y border-custom-border-200", className)}
      {...props}
    />
  )
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<React.ComponentRef<"tbody">, React.ComponentPropsWithoutRef<"tbody">>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn("", className)} {...props} />
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<React.ComponentRef<"tfoot">, React.ComponentPropsWithoutRef<"tfoot">>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("bg-custom-background-300 font-medium", className)} {...props} />
  )
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<React.ComponentRef<"tr">, React.ComponentPropsWithoutRef<"tr">>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("transition-colors data-[state=selected]:bg-custom-background-100", className)}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<React.ComponentRef<"th">, React.ComponentPropsWithoutRef<"th">>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-10 px-2 text-left align-middle font-medium text-custom-text-300 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<React.ComponentRef<"td">, React.ComponentPropsWithoutRef<"td">>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<React.ComponentRef<"caption">, React.ComponentPropsWithoutRef<"caption">>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-custom-text-300", className)} {...props} />
  )
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
