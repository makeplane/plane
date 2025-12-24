import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui-components/react/tabs";
import { cn } from "../utils/classname";

type TabsVariant = "contained";

type TabsContextType = {
  variant?: TabsVariant;
};

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

type TabsCompound = React.ForwardRefExoticComponent<
  React.ComponentProps<typeof TabsPrimitive.Root> & {
    variant?: TabsVariant;
  } & React.RefAttributes<React.ElementRef<typeof TabsPrimitive.Root>>
> & {
  List: React.ForwardRefExoticComponent<
    React.ComponentProps<typeof TabsPrimitive.List> & {
      background?: TabsVariant;
    } & React.RefAttributes<React.ElementRef<typeof TabsPrimitive.List>>
  >;
  Trigger: React.ForwardRefExoticComponent<
    React.ComponentProps<typeof TabsPrimitive.Tab> & {
      size?: "sm" | "md" | "lg";
      variant?: TabsVariant;
    } & React.RefAttributes<React.ElementRef<typeof TabsPrimitive.Tab>>
  >;
  Content: React.ForwardRefExoticComponent<
    React.ComponentProps<typeof TabsPrimitive.Panel> & React.RefAttributes<React.ElementRef<typeof TabsPrimitive.Panel>>
  >;
  Indicator: React.ForwardRefExoticComponent<React.ComponentProps<"div"> & React.RefAttributes<HTMLDivElement>>;
};

const TabsRoot = React.forwardRef(function TabsRoot(
  { className, variant, ...props }: React.ComponentProps<typeof TabsPrimitive.Root> & { variant?: TabsVariant },
  ref: React.ForwardedRef<React.ElementRef<typeof TabsPrimitive.Root>>
) {
  return (
    <TabsContext.Provider value={{ variant }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        className={cn("flex flex-col w-full h-full", className)}
        {...props}
        ref={ref}
      />
    </TabsContext.Provider>
  );
});

const TabsList = React.forwardRef(function TabsList(
  {
    className,
    background = "contained",
    ...props
  }: React.ComponentProps<typeof TabsPrimitive.List> & {
    background?: TabsVariant;
  },
  ref: React.ForwardedRef<React.ElementRef<typeof TabsPrimitive.List>>
) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "flex w-full items-center justify-between gap-1.5 rounded-lg text-13 p-0.5 relative overflow-auto",
        {
          "bg-layer-3": background === "contained",
        },
        className
      )}
      {...props}
      ref={ref}
    />
  );
});

const TabsTrigger = React.forwardRef(function TabsTrigger(
  {
    className,
    size = "md",
    ...props
  }: React.ComponentProps<typeof TabsPrimitive.Tab> & { size?: "sm" | "md" | "lg"; variant?: TabsVariant },
  ref: React.ForwardedRef<React.ElementRef<typeof TabsPrimitive.Tab>>
) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "flex items-center justify-center p-1 min-w-fit w-full font-medium text-primary outline-none focus:outline-none cursor-pointer transition-all duration-200 ease-in-out rounded-md border border-transparent",
        " data-[selected]:text-primary data-[selected]:shadow-sm data-[selected]:bg-layer-2 data-[selected]:border data-[selected]:border-subtle-1 data-[selected]:raised-200",
        "text-placeholder  hover:text-tertiary hover:bg-layer-transparent-hover",
        "disabled:text-placeholder disabled:cursor-not-allowed",
        {
          "text-11": size === "sm",
          "text-13": size === "md",
          "text-14": size === "lg",
        },
        className
      )}
      {...props}
      ref={ref}
    />
  );
});

const TabsContent = React.forwardRef(function TabsContent(
  { className, ...props }: React.ComponentProps<typeof TabsPrimitive.Panel>,
  ref: React.ForwardedRef<React.ElementRef<typeof TabsPrimitive.Panel>>
) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("relative outline-none", className)}
      {...props}
      ref={ref}
    />
  );
});
const TabsIndicator = React.forwardRef(function TabsIndicator(
  { className, ...props }: React.ComponentProps<"div">,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <div
      className={cn(
        "absolute left-0 top-[50%] z-[-1] h-6 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] -translate-y-[50%] rounded-xs bg-surface-1 shadow-sm transition-[width,transform] duration-200 ease-in-out",
        className
      )}
      {...props}
      ref={ref}
    />
  );
});

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
  Indicator: TabsIndicator,
}) satisfies TabsCompound;

export { TabsList, TabsTrigger, TabsContent, TabsIndicator };
