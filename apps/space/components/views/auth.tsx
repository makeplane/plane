// components
import { AuthRoot } from "@/components/account/auth-forms";
import { PoweredBy } from "@/components/common/powered-by";
// local imports
import { AuthHeader } from "./header";

export function AuthView() {
  return (
    <div className="relative z-10 flex h-screen w-screen flex-col items-center overflow-hidden overflow-y-auto bg-surface-1 px-8 pt-6 pb-10">
      <AuthHeader />
      <AuthRoot />
      <PoweredBy />
    </div>
  );
}
