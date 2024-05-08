"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
// components
import { PageHeader } from "@/components/core";

const RootPage = () => {
  const router = useRouter();

  useEffect(() => router.push("/login"), [router]);

  return (
    <>
      <PageHeader title="Plane - God Mode" />
    </>
  );
};

export default RootPage;
