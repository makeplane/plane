import { useEffect } from "react";

// next
import { NextPage } from "next";
import { useRouter } from "next/router";

const Index: NextPage = () => {
  const router = useRouter();
  // using asPath instead of query because query can be undefined
  const nextPath = router.asPath.split("next_path=")[1];

  useEffect(() => {
    router.push(`/login?next_path=${nextPath}`);
  }, [nextPath, router]);

  return null;
};

export default Index;
