import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { NextPage } from "next";
import { useRouter } from "next/router";

// components
import { LoginView } from "@/components/views";
// store
import { useMobxStore } from "@/lib/mobx/store-provider";
import { RootStore } from "@/store/root";

const Index: NextPage = observer(() => {
  const router = useRouter();
  const { next_path } = router.query;

  const {
    user: { currentUser },
  }: RootStore = useMobxStore();

  useEffect(() => {
    if (next_path && currentUser?.onboarding_step?.profile_complete)
      router.push(next_path.toString().replace(/[^a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]/g, ""));
  }, [router, next_path, currentUser]);

  return <LoginView />;
});

export default Index;
