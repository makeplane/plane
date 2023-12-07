import { useEffect } from "react";

// next
import { NextPage } from "next";
import { useRouter } from "next/router";
// components
import { LoginView } from "components/views";

const Index: NextPage = () => {
  const router = useRouter();
  const { next_path } = router.query as { next_path: string };

  useEffect(() => {
    if (next_path) router.push(`/?next_path=${next_path}`);
  }, [router, next_path]);

  return <LoginView />;
};

export default Index;
