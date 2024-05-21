"use client";

// components
import { UserLoggedIn } from "@/components/account";
import { LogoSpinner } from "@/components/common";
import { AuthView } from "@/components/views";
// hooks
import { useUser } from "@/hooks/store";

export default function HomePage() {
  const { data: currentUser, isAuthenticated, isLoading } = useUser();

  if (isLoading) return <LogoSpinner />;

  if (currentUser && isAuthenticated) return <UserLoggedIn />;

  return <AuthView />;
}
