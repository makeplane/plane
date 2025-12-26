import { CoreProviders } from "./core";
import { ExtendedProviders } from "./extended";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CoreProviders>
      <ExtendedProviders>{children}</ExtendedProviders>
    </CoreProviders>
  );
}
