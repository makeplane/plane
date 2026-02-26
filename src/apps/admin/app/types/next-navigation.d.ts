declare module "next/navigation" {
  export function useRouter(): {
    push: (to: string) => void;
    replace: (to: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (to: string) => Promise<void> | void;
  };

  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
}
