import { useEffect } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// components
import { LoginView } from "components/views";
// store
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

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
