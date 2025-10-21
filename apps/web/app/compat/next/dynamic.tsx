"use client";

import React from "react";

type DynamicOptions = {
  ssr?: boolean;
  loading?: React.ComponentType<{ className?: string }> | React.ReactNode;
  suspense?: boolean;
};

/**
 * Minimal shim for next/dynamic using React.lazy and Suspense.
 * - Respects { ssr: false } by rendering null during SSR.
 * - Supports a simple `loading` fallback (component or node).
 */
export default function dynamic<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }> | Promise<T>,
  options?: DynamicOptions
): React.ComponentType<React.ComponentProps<T>> {
  // Normalize loader to always return { default: Component }
  const loader = async () => {
    const mod: any = await importFn();
    if (mod && mod.default) return mod as { default: T };
    return { default: mod as T };
  };

  const Lazy = React.lazy(loader);

  const Fallback: React.ReactNode = (() => {
    const loading = options?.loading;
    if (!loading) return null;
    return typeof loading === "function" ? React.createElement(loading) : loading;
  })();

  const DynamicComponent: React.FC<any> = (props) => {
    if (options?.ssr === false && typeof window === "undefined") {
      return null;
    }
    // If caller wants to manage Suspense themselves
    if (options?.suspense) {
      return <Lazy {...props} />;
    }
    return (
      <React.Suspense fallback={Fallback}>
        <Lazy {...props} />
      </React.Suspense>
    );
  };

  DynamicComponent.displayName = "Dynamic";
  return DynamicComponent as React.ComponentType<React.ComponentProps<T>>;
}
