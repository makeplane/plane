import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import { cn } from "../utils/classname";

function CommandComponent({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return <CommandPrimitive data-slot="command" className={cn("", className)} {...props} />;
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex items-center gap-1.5 rounded border border-custom-border-100 bg-custom-background-90 px-2"
    >
      <SearchIcon className="size-3.5 flex-shrink-0 text-custom-text-400" strokeWidth={1.5} />
      <CommandPrimitive.Input data-slot="command-input" className={cn(className)} {...props} />
    </div>
  );
}

function CommandList({ ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List data-slot="command-list" {...props} />;
}

function CommandEmpty({ ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty data-slot="command-empty" {...props} />;
}

function CommandItem({ ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return <CommandPrimitive.Item data-slot="command-item" {...props} />;
}

const Command = Object.assign(CommandComponent, {
  Input: CommandInput,
  List: CommandList,
  Empty: CommandEmpty,
  Item: CommandItem,
});

export { Command };
