import { useEffect } from "react";

// next
import { NextPage } from "next";
import { useRouter } from "next/router";

const Index: NextPage = () => {
  const router = useRouter();
  const { next_path } = router.query as { next_path: string };

  useEffect(() => {
    if (next_path) router.push(`/login?next_path=${next_path}`);
    else router.push(`/login`);
  }, [router, next_path]);

  return null;
};

export default Index;
