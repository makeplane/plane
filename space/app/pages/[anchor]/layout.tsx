"use client";

import { observer } from "mobx-react-lite";
import Image from "next/image";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common";
// hooks
import { usePublish, usePublishList } from "@/hooks/store";
// plane web components
import { PageDetailsError } from "@/plane-web/components/pages";
// assets
import PlaneLogo from "@/public/plane-logo.svg";

type Props = {
  children: React.ReactNode;
  params: {
    anchor: string;
  };
};

const IssuesLayout = observer((props: Props) => {
  const { children, params } = props;
  // params
  const { anchor } = params;
  // store hooks
  const { fetchPublishSettings } = usePublishList();
  const { entity_identifier } = usePublish(anchor);
  // fetch publish settings
  const { error } = useSWR(
    anchor ? `PUBLISH_SETTINGS_${anchor}` : null,
    anchor ? () => fetchPublishSettings(anchor) : null
  );

  if (!entity_identifier && !error) return <LogoSpinner />;

  if (error) return <PageDetailsError />;

  return (
    <div className="size-full flex flex-col">
      <a
        href="https://plane.so"
        className="fixed bottom-2.5 right-5 !z-[999999] flex items-center gap-1 rounded border border-custom-border-200 bg-custom-background-100 px-2 py-1 shadow-custom-shadow-2xs"
        target="_blank"
        rel="noreferrer noopener"
      >
        <div className="relative grid h-6 w-6 place-items-center">
          <Image src={PlaneLogo} alt="Plane logo" className="h-6 w-6" height="24" width="24" />
        </div>
        <div className="text-xs">
          Powered by <span className="font-semibold">Plane Publish</span>
        </div>
      </a>
      {children}
    </div>
  );
});

export default IssuesLayout;
