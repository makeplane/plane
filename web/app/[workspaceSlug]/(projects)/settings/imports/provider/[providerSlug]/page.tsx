"use client";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useInstance, useWorkspace } from "@/hooks/store";
import SiloIframe from "@/plane-web/components/iframe/silo-iframe";

const ImportProviderPage = observer(() => {
  const { workspaceSlug, providerSlug } = useParams();

  const { config } = useInstance();

  const { currentWorkspace } = useWorkspace();

  if (config?.silo_base_url) {
    return (
      <SiloIframe
        srcBase={`${config?.silo_base_url}/${providerSlug}/?wsslug=${workspaceSlug}&wsid=${currentWorkspace?.id}`}
      />
    );
  }
});

export default ImportProviderPage;
