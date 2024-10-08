"use client";
import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { useInstance, useWorkspace } from "@/hooks/store";
import SiloIframe from "@/plane-web/components/iframe/silo-iframe";

const ImportProviderPage = observer(() => {
  const { workspaceSlug, providerSlug } = useParams();

  const router = useRouter();

  const { config } = useInstance();

  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.msg === "created-migration") {
        router.push(`/${workspaceSlug}/settings/imports`);
      }
    };

    window.addEventListener("message", handleMessage, false);

    return () => {
      window.removeEventListener("message", handleMessage, false);
    };
  }, [router, workspaceSlug]);

  if (config?.silo_base_url) {
    return (
      <SiloIframe
        srcBase={`${config?.silo_base_url}/${providerSlug}/?wsslug=${workspaceSlug}&wsid=${currentWorkspace?.id}`}
      />
    );
  }
});

export default ImportProviderPage;
