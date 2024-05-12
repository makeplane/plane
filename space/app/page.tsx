"use client";
// components
import { AuthView } from "@/components/views";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
import { useInstance } from "@/hooks/store";
// wrapper
import { AuthWrapper } from "@/lib/wrappers";

export default function HomePage() {
  const { data } = useInstance();

  console.log("data", data);

  return (
    <AuthWrapper pageType={EPageTypes.INIT}>
      <AuthView />
    </AuthWrapper>
  );
}
