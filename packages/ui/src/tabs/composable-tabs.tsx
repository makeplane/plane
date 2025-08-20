import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui-components/react/tabs";
import { cn } from "../utils";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col w-full h-full", className)} {...props} />;
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "flex w-full min-w-fit items-center justify-between gap-1.5 rounded-md text-sm p-0.5 bg-custom-background-80/60 relative",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Tab>) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "flex items-center justify-center p-1 min-w-fit w-full font-medium text-custom-text-100 outline-none focus:outline-none cursor-pointer transition-all rounded",
        "data-[state=active]:bg-custom-background-100 data-[state=active]:text-custom-text-100 data-[state=active]:shadow-sm",
        "text-custom-text-400 hover:text-custom-text-300 hover:bg-custom-background-80/60",
        "disabled:text-custom-text-400 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Panel>) {
  return <TabsPrimitive.Panel data-slot="tabs-content" className={cn("relative outline-none", className)} {...props} />;
}

function TabsIndicator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "absolute left-0 top-[50%] z-[-1] h-6 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] -translate-y-[50%] rounded-sm bg-custom-background-100 shadow-sm transition-[width,transform] duration-200 ease-in-out",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsIndicator };
