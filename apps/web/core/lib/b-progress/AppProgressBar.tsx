// import { useRouter as useBProgressRouter } from "@bprogress/next";
import { useNavigate as useRouterRR } from "react-router";

export function useRouter() {
  const router = useRouterRR();
  return router;
}
