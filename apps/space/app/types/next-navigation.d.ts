declare module "next/navigation" {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (url: string) => Promise<void>;
  };

  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useParams<T = Record<string, string>>(): T;
}
