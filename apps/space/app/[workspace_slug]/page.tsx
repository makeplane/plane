"use client";

// next imports
import { useRouter, useParams, useSearchParams } from "next/navigation";

const WorkspaceProjectPage = () => {
  const routerParams = useParams();
  const { workspace_slug } = routerParams as { workspace_slug: string };

  return (
    <div className="relative w-screen h-screen flex justify-center items-center text-5xl">
      Plane {workspace_slug || "nahh"}
    </div>
  );
};

export default WorkspaceProjectPage;
