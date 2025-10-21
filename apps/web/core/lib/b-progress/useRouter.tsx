import { useRouter as useNextRouter } from "next/navigation";
import { useProgress } from "@bprogress/react";

export interface NavigateOptions {
  showProgress?: boolean;
}

export const useRouter = () => {
  const router = useNextRouter();
  const { start, stop } = useProgress();

  return {
    ...router,
    push: (href: string, options?: NavigateOptions) => {
      if (options?.showProgress !== false) {
        start();
      }
      router.push(href);
      if (options?.showProgress !== false) {
        // The ReactRouterProgressProvider will handle stopping on route change
        // But we stop here as a fallback
        setTimeout(() => stop(), 100);
      }
    },
  };
};
