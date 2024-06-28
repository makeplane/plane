// type
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
// router from next-nprogress-bar
import { useRouter } from "@/lib/n-progress";

export const useAppRouter = (): AppRouterInstance => useRouter();
