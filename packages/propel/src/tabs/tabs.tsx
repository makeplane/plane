import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui-components/react/tabs";
import { cn } from "../utils/classname";

type TabsCompound = React.ForwardRefExoticComponent<
  React.ComponentProps<typeof TabsPrimitive.Root> & React.RefAttributes<React.ElementRef<typeof TabsPrimitive.Root>>
> & {
  List: React.ForwardRefExoticComponent<
    React.ComponentProps<typeof TabsPrimitive.List> & React.RefAttributes<React.ElementRef<typeof TabsPrimitive.List>>
  >;
  Trigger: React.ForwardRefExoticComponent<
    React.ComponentProps<typeof TabsPrimitive.Tab> & { size?: "sm" | "md" | "lg" } & React.RefAttributes<
        React.ElementRef<typeof TabsPrimitive.Tab>
      >
  >;
  Content: React.ForwardRefExoticComponent<
    React.ComponentProps<typeof TabsPrimitive.Panel> & React.RefAttributes<React.ElementRef<typeof TabsPrimitive.Panel>>
  >;
  Indicator: React.ForwardRefExoticComponent<React.ComponentProps<"div"> & React.RefAttributes<HTMLDivElement>>;
};

const TabsRoot = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentProps<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col w-full h-full", className)} {...props} ref={ref} />
));

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentProps<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    data-slot="tabs-list"
    className={cn(
      "flex w-full min-w-fit items-center justify-between gap-1.5 rounded-md text-sm p-0.5 bg-custom-background-80/60 relative overflow-auto",
      className
    )}
    {...props}
    ref={ref}
  />
));

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Tab>,
  React.ComponentProps<typeof TabsPrimitive.Tab> & { size?: "sm" | "md" | "lg" }
>(({ className, size = "md", ...props }, ref) => (
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
    ref={ref}
  />
));

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Panel>,
  React.ComponentProps<typeof TabsPrimitive.Panel>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Panel
    data-slot="tabs-content"
    className={cn("relative outline-none", className)}
    {...props}
    ref={ref}
  />
));
const TabsIndicator = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div
    className={cn(
      "absolute left-0 top-[50%] z-[-1] h-6 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] -translate-y-[50%] rounded-sm bg-custom-background-100 shadow-sm transition-[width,transform] duration-200 ease-in-out",
      className
    )}
    {...props}
    ref={ref}
  />
));

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
  Indicator: TabsIndicator,
}) satisfies TabsCompound;

export { TabsList, TabsTrigger, TabsContent, TabsIndicator };
