declare module "next/navigation" {
  export const useRouter: typeof import("../compat/next/navigation").useRouter;
  export const usePathname: typeof import("../compat/next/navigation").usePathname;
  export const useSearchParams: typeof import("../compat/next/navigation").useSearchParams;
  export const useParams: typeof import("../compat/next/navigation").useParams;
}
