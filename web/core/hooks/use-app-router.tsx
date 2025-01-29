import { useRouter } from "@/lib/n-progress";
import { TAppRouterInstance } from "@/lib/n-progress/AppProgressBar";

export const useAppRouter = (): TAppRouterInstance => useRouter();
