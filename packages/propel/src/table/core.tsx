import * as React from "react";

import { cn } from "../utils/classname";

const Table = React.forwardRef(function Table(
  { className, ...props }: React.ComponentPropsWithoutRef<"table">,
  ref: React.ForwardedRef<React.ComponentRef<"table">>
) {
  return (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-13", className)} {...props} />
    </div>
  );
});
Table.displayName = "Table";

const TableHeader = React.forwardRef(function TableHeader(
  { className, ...props }: React.ComponentPropsWithoutRef<"thead">,
  ref: React.ForwardedRef<React.ComponentRef<"thead">>
) {
  return <thead ref={ref} className={cn("bg-layer-1 py-4 border-y border-subtle", className)} {...props} />;
});
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef(function TableBody(
  { className, ...props }: React.ComponentPropsWithoutRef<"tbody">,
  ref: React.ForwardedRef<React.ComponentRef<"tbody">>
) {
  return <tbody ref={ref} className={cn("", className)} {...props} />;
});
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef(function TableFooter(
  { className, ...props }: React.ComponentPropsWithoutRef<"tfoot">,
  ref: React.ForwardedRef<React.ComponentRef<"tfoot">>
) {
  return <tfoot ref={ref} className={cn("bg-layer-1 font-medium", className)} {...props} />;
});
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef(function TableRow(
  { className, ...props }: React.ComponentPropsWithoutRef<"tr">,
  ref: React.ForwardedRef<React.ComponentRef<"tr">>
) {
  return <tr ref={ref} className={cn("transition-colors data-[state=selected]:bg-surface-1", className)} {...props} />;
});
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef(function TableHead(
  { className, ...props }: React.ComponentPropsWithoutRef<"th">,
  ref: React.ForwardedRef<React.ComponentRef<"th">>
) {
  return (
    <th
      ref={ref}
      className={cn(
        "h-10 px-2 text-left align-middle font-medium text-tertiary [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
});
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef(function TableCell(
  { className, ...props }: React.ComponentPropsWithoutRef<"td">,
  ref: React.ForwardedRef<React.ComponentRef<"td">>
) {
  return (
    <td
      ref={ref}
      className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)}
      {...props}
    />
  );
});
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef(function TableCaption(
  { className, ...props }: React.ComponentPropsWithoutRef<"caption">,
  ref: React.ForwardedRef<React.ComponentRef<"caption">>
) {
  return <caption ref={ref} className={cn("mt-4 text-13 text-tertiary", className)} {...props} />;
});
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
