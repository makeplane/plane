import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router";
import { useProgress } from "@bprogress/react";

interface ProgressProviderProps {
  children: React.ReactNode;
}

export function ReactRouterProgressProvider({ children }: ProgressProviderProps) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const { start, stop } = useProgress();

  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, [location, navigationType, start, stop]);

  return <>{children}</>;
}
