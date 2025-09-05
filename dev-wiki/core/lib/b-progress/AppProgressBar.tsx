import { useRouter as useBProgressRouter } from "@bprogress/next";

export function useRouter() {
  const router = useBProgressRouter();
  return router;
}
