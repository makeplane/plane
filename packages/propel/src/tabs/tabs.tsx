import { Tabs as TabsPrimitive } from "@base-ui-components/react/tabs";
import * as React from "react";
import { cn } from "@plane/utils";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col w-full h-full", className)} {...props} />;
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "flex w-full min-w-fit items-center justify-between gap-1.5 rounded-md text-sm p-0.5 bg-custom-background-80/60 relative overflow-auto",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  size = "md",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Tab> & { size?: "sm" | "md" | "lg" }) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "flex items-center justify-center p-1 min-w-fit w-full font-medium text-custom-text-100 outline-none focus:outline-none cursor-pointer transition-all duration-200 ease-in-out rounded",
        "data-[selected]:bg-custom-background-100 data-[selected]:text-custom-text-100 data-[selected]:shadow-sm",
        "text-custom-text-400 hover:text-custom-text-300 hover:bg-custom-background-80/60",
        "disabled:text-custom-text-400 disabled:cursor-not-allowed",
        {
          "text-xs": size === "sm",
          "text-sm": size === "md",
          "text-base": size === "lg",
        },
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

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;
Tabs.Indicator = TabsIndicator;

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsIndicator };
