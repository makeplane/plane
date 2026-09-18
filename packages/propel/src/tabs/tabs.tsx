/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
        className={cn("flex h-full w-full flex-col", className)}
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
        "relative flex w-full items-center justify-between gap-1.5 overflow-auto rounded-lg p-0.5 text-13",
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
        "flex w-full min-w-fit cursor-pointer items-center justify-center rounded-md border border-transparent p-1 font-medium text-primary transition-all duration-200 ease-in-out outline-none focus:outline-none",
        "data-[selected]:shadow-sm data-[selected]:raised-200 data-[selected]:border data-[selected]:border-subtle-1 data-[selected]:bg-layer-2 data-[selected]:text-primary",
        "text-placeholder hover:bg-layer-transparent-hover hover:text-tertiary",
        "disabled:cursor-not-allowed disabled:text-placeholder",
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
        "shadow-sm absolute top-[50%] left-0 z-[-1] h-6 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] -translate-y-[50%] rounded-xs bg-surface-1 transition-[width,transform] duration-200 ease-in-out",
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
